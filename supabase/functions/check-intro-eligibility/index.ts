import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if customer has any previous paid bookings
    const { data: previousBookings, error: bookingsError } = await supabaseClient
      .from("bookings")
      .select("id")
      .eq("customer_email", email.toLowerCase().trim())
      .eq("payment_status", "paid")
      .limit(1);

    if (bookingsError) throw bookingsError;

    // Check if customer has ever purchased the intro offer
    // We track this via customer_tokens with a specific note pattern
    const { data: introTokens, error: tokensError } = await supabaseClient
      .from("customer_tokens")
      .select("id")
      .eq("customer_email", email.toLowerCase().trim())
      .ilike("notes", "%Introductory Offer%")
      .limit(1);

    if (tokensError) throw tokensError;

    const hasPreviousBookings = previousBookings && previousBookings.length > 0;
    const hasUsedIntroOffer = introTokens && introTokens.length > 0;
    
    const isEligible = !hasPreviousBookings && !hasUsedIntroOffer;

    return new Response(
      JSON.stringify({ 
        isEligible,
        reason: hasPreviousBookings 
          ? "You have previous bookings with us" 
          : hasUsedIntroOffer 
            ? "You have already used the Introductory Offer"
            : null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error checking intro eligibility:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
