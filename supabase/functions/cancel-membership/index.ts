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
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Authentication required");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseClient.auth.getUser(token);
    if (userErr || !userData?.user) throw new Error("Invalid authentication");
    const user = userData.user;

    const { membershipId } = await req.json();
    if (!membershipId) throw new Error("Missing membershipId");

    // Load & verify ownership using authenticated user id (do NOT trust body)
    const { data: membership, error: membershipError } = await supabaseClient
      .from("memberships")
      .select("*")
      .eq("id", membershipId)
      .single();

    if (membershipError || !membership) throw new Error("Membership not found");
    if (membership.user_id !== user.id) {
      throw new Error("You do not have permission to cancel this membership");
    }

    // If we have a Stripe subscription id, always ask Stripe for its true state
    if (membership.stripe_subscription_id) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      try {
        const sub = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);
        const shouldCancel = ["active", "trialing", "past_due", "unpaid", "paused"].includes(sub.status);

        if (shouldCancel && !sub.cancel_at_period_end) {
          await stripe.subscriptions.update(membership.stripe_subscription_id, {
            cancel_at_period_end: true,
          });
          console.log("Stripe subscription set to cancel at period end:", membership.stripe_subscription_id);
        } else {
          console.log(
            "Stripe subscription not modified (status:",
            sub.status,
            ", cancel_at_period_end:",
            sub.cancel_at_period_end,
            ")"
          );
        }
      } catch (stripeError) {
        console.error("Stripe cancellation failed:", stripeError);
        const msg = stripeError instanceof Error ? stripeError.message : "Stripe error";
        // Do NOT update the local record — avoids silent recurring charges
        return new Response(
          JSON.stringify({
            error: `Could not cancel your Stripe subscription: ${msg}. No changes were made. Please contact support.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
        );
      }
    }

    const { error: updateError } = await supabaseClient
      .from("memberships")
      .update({
        is_auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", membershipId);
    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: "Subscription will not renew" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error canceling membership:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
