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
    const { membershipType, userId } = await req.json();

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

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: plan.name,
              description: `Revitalise Hub Membership - ${plan.name}`,
            },
            unit_amount: plan.price,
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
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating membership payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});