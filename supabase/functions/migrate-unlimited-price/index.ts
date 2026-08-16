import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NEW_AMOUNT = 6000; // £60 in pence

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // AuthZ: service role or admin only
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "__none__");
    if (!isServiceRole) {
      const { data: authData, error: authErr } = await supabaseClient.auth.getUser(token);
      if (authErr || !authData?.user) {
        return new Response(JSON.stringify({ error: "Invalid authentication" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: adminRole } = await supabaseClient
        .from("user_roles").select("role").eq("user_id", authData.user.id).eq("role", "admin").maybeSingle();
      if (!adminRole) {
        return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }


    // Find or create the £60/month recurring price
    let priceId: string | null = null;
    const existingPrices = await stripe.prices.list({ active: true, currency: "gbp", type: "recurring", limit: 100 });
    for (const p of existingPrices.data) {
      if (p.unit_amount === NEW_AMOUNT && p.recurring?.interval === "month") {
        priceId = p.id;
        break;
      }
    }
    if (!priceId) {
      const created = await stripe.prices.create({
        currency: "gbp",
        unit_amount: NEW_AMOUNT,
        recurring: { interval: "month" },
        product_data: { name: "Unlimited Membership" },
      });
      priceId = created.id;
    }

    // Active unlimited memberships with a Stripe subscription
    const { data: memberships, error: mErr } = await supabaseClient
      .from("memberships")
      .select("id, customer_email, stripe_subscription_id, price_amount")
      .eq("membership_type", "unlimited")
      .eq("status", "active")
      .not("stripe_subscription_id", "is", null);

    if (mErr) throw mErr;

    const results: Array<Record<string, unknown>> = [];

    for (const m of memberships ?? []) {
      try {
        const sub = await stripe.subscriptions.retrieve(m.stripe_subscription_id as string);
        if (sub.status === "canceled" || sub.status === "incomplete_expired") {
          results.push({ id: m.id, email: m.customer_email, skipped: `subscription ${sub.status}` });
          continue;
        }

        const items = sub.items.data;
        if (items.length !== 1) {
          results.push({ id: m.id, email: m.customer_email, skipped: `unexpected item count ${items.length}` });
          continue;
        }

        if (items[0].price.unit_amount === NEW_AMOUNT) {
          results.push({ id: m.id, email: m.customer_email, skipped: "already £60" });
        } else {
          await stripe.subscriptions.update(sub.id, {
            items: [{ id: items[0].id, price: priceId }],
            proration_behavior: "none",
          });
          results.push({ id: m.id, email: m.customer_email, updated: true, subscription: sub.id });
        }

        const { error: upErr } = await supabaseClient
          .from("memberships")
          .update({ price_amount: NEW_AMOUNT })
          .eq("id", m.id);
        if (upErr) throw upErr;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error("Failed to migrate membership", m.id, msg);
        results.push({ id: m.id, email: m.customer_email, error: msg });
      }
    }

    return new Response(JSON.stringify({ priceId, total: memberships?.length ?? 0, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("migrate-unlimited-price error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
