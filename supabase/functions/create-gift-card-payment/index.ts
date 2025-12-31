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
      message
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

    const amountInPence = Math.round(amount * 100);

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
            unit_amount: amountInPence,
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
        amount: amountInPence,
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

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in create-gift-card-payment:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});