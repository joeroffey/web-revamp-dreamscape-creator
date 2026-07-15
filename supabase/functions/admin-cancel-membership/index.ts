import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  membershipId: string;
  // action: cancel at period end, or immediate. Default: period_end.
  immediate?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Authentication required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) throw new Error("Invalid authentication");

    // Verify admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Admin access required");

    const { membershipId, immediate }: Body = await req.json();
    if (!membershipId) throw new Error("membershipId required");

    const { data: membership, error: mErr } = await supabase
      .from("memberships")
      .select("*")
      .eq("id", membershipId)
      .single();
    if (mErr || !membership) throw new Error("Membership not found");

    let stripeCancelled = false;
    let stripeDetail = "No Stripe subscription attached to this membership.";

    if (membership.stripe_subscription_id) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });
      try {
        // Fetch to confirm current state and be robust to out-of-sync flags
        const sub = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);
        const cancellable = ["active", "trialing", "past_due", "unpaid", "paused"].includes(sub.status);

        if (sub.status === "canceled") {
          stripeCancelled = true;
          stripeDetail = "Stripe subscription was already cancelled.";
        } else if (!cancellable) {
          stripeDetail = `Stripe subscription in status "${sub.status}" — nothing to cancel.`;
        } else if (immediate) {
          await stripe.subscriptions.cancel(membership.stripe_subscription_id);
          stripeCancelled = true;
          stripeDetail = "Stripe subscription cancelled immediately.";
        } else {
          await stripe.subscriptions.update(membership.stripe_subscription_id, {
            cancel_at_period_end: true,
          });
          stripeCancelled = true;
          stripeDetail = "Stripe subscription set to cancel at period end.";
        }
        console.log("admin-cancel-membership Stripe result:", stripeDetail);
      } catch (stripeError) {
        console.error("Stripe cancel failed:", stripeError);
        // DO NOT update DB if Stripe failed
        const msg = stripeError instanceof Error ? stripeError.message : "Unknown Stripe error";
        return new Response(
          JSON.stringify({
            error: `Stripe cancellation failed: ${msg}. Membership was NOT marked cancelled in the database to avoid drift.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
        );
      }
    }

    // Only now update DB
    const newStatus = immediate ? "cancelled" : membership.status; // keep active until period end unless immediate
    const { error: updErr } = await supabase
      .from("memberships")
      .update({
        status: immediate ? "cancelled" : membership.status,
        is_auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", membershipId);
    if (updErr) throw updErr;

    // If admin picks "Cancel" from the UI they usually want the badge to show cancelled straight away.
    // We already flipped is_auto_renew off; also mark cancelled at period end for clarity.
    if (!immediate) {
      await supabase
        .from("memberships")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", membershipId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        stripeCancelled,
        stripeDetail,
        message: stripeCancelled
          ? `Membership cancelled. ${stripeDetail}`
          : `Membership marked cancelled. ${stripeDetail}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("admin-cancel-membership error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
