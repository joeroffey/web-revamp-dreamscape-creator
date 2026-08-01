import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RedeemRequest {
  giftCode: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the authorization header to identify the user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Authentication required. Please sign in to redeem your gift card.");
    }

    // Verify the user's JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid authentication. Please sign in again.");
    }

    const { giftCode }: RedeemRequest = await req.json();

    if (!giftCode) {
      throw new Error("Gift card code is required");
    }

    // Find the gift card
    const { data: giftCard, error: giftCardError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('gift_code', giftCode.toUpperCase().trim())
      .single();

    if (giftCardError || !giftCard) {
      throw new Error("Invalid gift card code. Please check and try again.");
    }

    // Check if gift card has been paid
    if (giftCard.payment_status !== 'paid') {
      throw new Error("This gift card has not been paid for yet.");
    }

    // Check if already redeemed
    if (giftCard.is_redeemed) {
      throw new Error("This gift card has already been redeemed.");
    }

    // Check expiry (if set)
    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      throw new Error("This gift card has expired.");
    }

    // Calculate credit expiry (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create customer credit record
    const { error: creditError } = await supabase
      .from('customer_credits')
      .insert({
        user_id: user.id,
        customer_email: user.email?.toLowerCase() || '',
        credit_balance: giftCard.amount, // Amount is already in pence
        gift_card_id: giftCard.id,
        expires_at: expiresAt.toISOString(),
        redeemed_at: new Date().toISOString()
      });

    if (creditError) {
      console.error("Error creating credit:", creditError);
      throw new Error("Failed to redeem gift card. Please try again.");
    }

    // Mark gift card as redeemed
    const { error: updateError } = await supabase
      .from('gift_cards')
      .update({
        is_redeemed: true,
        redeemed_at: new Date().toISOString(),
        redeemed_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', giftCard.id);

    if (updateError) {
      console.error("Error updating gift card:", updateError);
    }

    // Also add/update customer record if not exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', user.email?.toLowerCase())
      .maybeSingle();

    if (!existingCustomer) {
      await supabase.from('customers').insert({
        email: user.email?.toLowerCase() || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        phone: user.user_metadata?.phone || null
      });
    }

    const amountInPounds = (giftCard.amount / 100).toFixed(2);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Gift card redeemed successfully! £${amountInPounds} has been added to your credit balance.`,
        creditAmount: giftCard.amount,
        expiresAt: expiresAt.toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error redeeming gift card:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
