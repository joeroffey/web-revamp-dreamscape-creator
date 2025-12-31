import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftCardRequest {
  purchaserName: string;
  purchaserEmail: string;
  recipientName?: string;
  recipientEmail?: string;
  amount: number; // in pounds
  message?: string;
  discountCode?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      purchaserName,
      purchaserEmail,
      recipientName,
      recipientEmail,
      amount,
      message,
      discountCode
    }: GiftCardRequest = await req.json();

    // Validate required fields
    if (!purchaserName || !purchaserEmail || !amount) {
      throw new Error("Missing required gift card information");
    }

    // Validate amount (minimum £10, maximum £500)
    if (amount < 10 || amount > 500) {
      throw new Error("Gift card amount must be between £10 and £500");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase client with service role for writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const originalAmountInPence = Math.round(amount * 100);

    // Optional discount code
    let discountCodeRow: any = null;
    let discountAmount = 0;
    if (discountCode && discountCode.trim().length > 0) {
      const code = discountCode.trim().toUpperCase();
      const { data: dc, error: dcErr } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (dcErr) throw dcErr;
      if (!dc) throw new Error('Invalid discount code');

      const now = new Date();
      const validFromOk = !dc.valid_from || new Date(dc.valid_from) <= now;
      const validUntilOk = !dc.valid_until || new Date(dc.valid_until) >= now;
      const activeOk = dc.is_active !== false;
      const usesOk = !dc.max_uses || (dc.current_uses || 0) < dc.max_uses;
      const minOk = !dc.min_amount || originalAmountInPence >= dc.min_amount;
      if (!activeOk || !validFromOk || !validUntilOk || !usesOk || !minOk) {
        throw new Error('Discount code is not valid for this gift card');
      }

      discountCodeRow = dc;
      if (dc.discount_type === 'percentage') {
        discountAmount = Math.round(originalAmountInPence * (dc.discount_value / 100));
      } else {
        discountAmount = Math.min(originalAmountInPence, dc.discount_value);
      }
    }

    const finalAmountInPence = Math.max(0, originalAmountInPence - discountAmount);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: purchaserEmail,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Revitalise Hub Gift Card - £${amount}`,
              description: recipientName 
                ? `Gift card for ${recipientName}` 
                : "Revitalise Hub wellness gift card",
            },
            unit_amount: finalAmountInPence,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/gift-card-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/gift-cards`,
      metadata: {
        type: "gift_card",
        purchaserName,
        purchaserEmail,
        amount: amount.toString(),
        discountCode: discountCodeRow?.code || "",
        discountCodeId: discountCodeRow?.id || "",
        originalAmount: originalAmountInPence.toString(),
        discountAmount: discountAmount.toString(),
        finalAmount: finalAmountInPence.toString(),
      }
    });

    // Store gift card in database
    const { error: giftCardError } = await supabase
      .from("gift_cards")
      .insert({
        purchaser_name: purchaserName,
        purchaser_email: purchaserEmail,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        amount: originalAmountInPence,
        discount_code_id: discountCodeRow?.id || null,
        discount_amount: discountAmount,
        final_amount: finalAmountInPence,
        message: message,
        stripe_session_id: session.id,
        payment_status: "pending",
      });

    if (giftCardError) {
      console.error("Error storing gift card:", giftCardError);
      throw new Error("Failed to store gift card information");
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in create-gift-card-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});