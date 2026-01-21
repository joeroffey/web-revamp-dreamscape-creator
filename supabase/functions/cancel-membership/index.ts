import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { membershipId, userId } = await req.json();

    if (!membershipId || !userId) {
      throw new Error("Missing required fields");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the membership
    const { data: membership, error: membershipError } = await supabaseClient
      .from('memberships')
      .select('*')
      .eq('id', membershipId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      throw new Error("Membership not found");
    }

    // Cancel the Stripe subscription if it exists and is auto-renewing
    if (membership.stripe_subscription_id && membership.is_auto_renew) {
      try {
        // Cancel at period end to allow user to use remaining time
        await stripe.subscriptions.update(membership.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
        console.log("Stripe subscription set to cancel at period end:", membership.stripe_subscription_id);
      } catch (stripeError) {
        console.error("Error canceling Stripe subscription:", stripeError);
        // Continue to update local record even if Stripe fails
      }
    }

    // Update the membership to mark as cancelled (will expire at end of period)
    const { error: updateError } = await supabaseClient
      .from('memberships')
      .update({ 
        is_auto_renew: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', membershipId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, message: "Subscription will not renew" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error canceling membership:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
