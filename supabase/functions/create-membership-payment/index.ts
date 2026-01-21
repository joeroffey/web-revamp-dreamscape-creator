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
    const { membershipType, userId, discountCode, autoRenew = false } = await req.json();

    if (!membershipType || !userId) {
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

    // Get user details
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
    if (userError || !userData.user?.email) {
      throw new Error("User not found");
    }

    const user = userData.user;

    // Define membership pricing and details
    const membershipPlans = {
      "1_session_week": {
        price: 4800, // £48 in pence
        name: "1 Session Per Week",
        sessions_per_week: 1,
        discount_percentage: 10
      },
      "2_sessions_week": {
        price: 7500, // £75 in pence
        name: "2 Sessions Per Week", 
        sessions_per_week: 2,
        discount_percentage: 10
      },
      "unlimited": {
        price: 10000, // £100 in pence
        name: "Unlimited Membership",
        sessions_per_week: 999,
        discount_percentage: 15
      }
    };

    const plan = membershipPlans[membershipType as keyof typeof membershipPlans];
    if (!plan) {
      throw new Error("Invalid membership type");
    }

    // Optional discount code (applied to first month only via lower unit_amount)
    let discountCodeRow: any = null;
    let discountAmount = 0;
    if (discountCode && typeof discountCode === 'string' && discountCode.trim().length > 0) {
      const code = discountCode.trim().toUpperCase();
      const { data: dc, error: dcErr } = await supabaseClient
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
      const minOk = !dc.min_amount || plan.price >= dc.min_amount;
      if (!activeOk || !validFromOk || !validUntilOk || !usesOk || !minOk) {
        throw new Error('Discount code is not valid for this membership');
      }

      discountCodeRow = dc;
      if (dc.discount_type === 'percentage') {
        discountAmount = Math.round(plan.price * (dc.discount_value / 100));
      } else {
        discountAmount = Math.min(plan.price, dc.discount_value);
      }
    }

    const finalAmount = Math.max(0, plan.price - discountAmount);

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Stripe checkout session - subscription for auto-renew, payment for one-time
    if (autoRenew) {
      // Subscription mode for auto-renewal
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: plan.name,
                description: `Revitalise Hub Membership - ${plan.name} (Auto-Renewing)`,
              },
              unit_amount: finalAmount,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/membership-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/memberships`,
        metadata: {
          userId: userId,
          membershipType: membershipType,
          sessions_per_week: plan.sessions_per_week.toString(),
          discount_percentage: plan.discount_percentage.toString(),
          discountCode: discountCodeRow?.code || "",
          discountCodeId: discountCodeRow?.id || "",
          originalAmount: plan.price.toString(),
          discountAmount: discountAmount.toString(),
          finalAmount: finalAmount.toString(),
          isAutoRenew: "true",
        }
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Payment mode for one-time purchase (no auto-renewal)
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: plan.name,
                description: `Revitalise Hub Membership - ${plan.name} (1 Month)`,
              },
              unit_amount: finalAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/membership-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/memberships`,
        metadata: {
          type: "membership_onetime",
          userId: userId,
          membershipType: membershipType,
          sessions_per_week: plan.sessions_per_week.toString(),
          discount_percentage: plan.discount_percentage.toString(),
          discountCode: discountCodeRow?.code || "",
          discountCodeId: discountCodeRow?.id || "",
          originalAmount: plan.price.toString(),
          discountAmount: discountAmount.toString(),
          finalAmount: finalAmount.toString(),
          isAutoRenew: "false",
        }
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    console.error("Error creating membership payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});