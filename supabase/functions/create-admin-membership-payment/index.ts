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
    const { 
      customerEmail, 
      customerName, 
      membershipType, 
      durationMonths = 1,
      paymentMethod = "card" // "card" or "bacs_debit"
    } = await req.json();

    if (!customerEmail || !membershipType) {
      throw new Error("Missing required fields: customerEmail and membershipType");
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

    // Define membership pricing (monthly)
    const membershipPlans: Record<string, { price: number; name: string; sessions_per_month: number }> = {
      "4_sessions_month": {
        price: 4800, // £48 in pence
        name: "4 Sessions Per Month",
        sessions_per_month: 4,
      },
      "8_sessions_month": {
        price: 7500, // £75 in pence
        name: "8 Sessions Per Month", 
        sessions_per_month: 8,
      },
      "unlimited": {
        price: 10000, // £100 in pence
        name: "Unlimited Membership",
        sessions_per_month: 999,
      },
    };

    const plan = membershipPlans[membershipType];
    if (!plan) {
      throw new Error("Invalid membership type");
    }

    // Check if customer exists in Stripe, or create them
    let customerId: string;
    const customers = await stripe.customers.list({ email: customerEmail.toLowerCase(), limit: 1 });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: customerEmail.toLowerCase(),
        name: customerName || undefined,
      });
      customerId = newCustomer.id;
    }

    // Create a Checkout Session for setting up payment method + subscription
    const paymentMethodTypes = paymentMethod === "bacs_debit" ? ["bacs_debit"] : ["card"];
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethodTypes as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: plan.name,
              description: `Revitalise Hub Membership - ${plan.name} (Auto-Renewing)`,
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
      success_url: `${req.headers.get("origin")}/admin/memberships?setup_success=true&customer=${encodeURIComponent(customerEmail)}`,
      cancel_url: `${req.headers.get("origin")}/admin/memberships?setup_cancelled=true`,
      ...(paymentMethod === "bacs_debit" && {
        payment_method_options: {
          bacs_debit: {
            setup_future_usage: "off_session",
          },
        },
      }),
      metadata: {
        admin_created: "true",
        customerEmail: customerEmail.toLowerCase(),
        customerName: customerName || "",
        membershipType: membershipType,
        sessions_per_month: plan.sessions_per_month.toString(),
        durationMonths: durationMonths.toString(),
        paymentMethod: paymentMethod,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating admin membership payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
