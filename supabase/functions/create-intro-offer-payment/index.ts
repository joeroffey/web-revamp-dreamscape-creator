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
    const { email, name, phone } = await req.json();

    if (!email || !name) {
      throw new Error("Email and name are required");
    }

    const customerEmail = email.toLowerCase().trim();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Double-check eligibility before processing payment
    const { data: previousBookings } = await supabaseClient
      .from("bookings")
      .select("id")
      .eq("customer_email", customerEmail)
      .eq("payment_status", "paid")
      .limit(1);

    const { data: introTokens } = await supabaseClient
      .from("customer_tokens")
      .select("id")
      .eq("customer_email", customerEmail)
      .ilike("notes", "%Introductory Offer%")
      .limit(1);

    if ((previousBookings && previousBookings.length > 0) || (introTokens && introTokens.length > 0)) {
      throw new Error("You are not eligible for the Introductory Offer");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Stripe checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Introductory Offer - 3 Sessions",
              description: "First-timer special: 3 sessions to use within 3 months",
            },
            unit_amount: 3500, // £35 in pence
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/membership-success?session_id={CHECKOUT_SESSION_ID}&type=intro`,
      cancel_url: `${req.headers.get("origin")}/memberships`,
      metadata: {
        type: "intro_offer",
        customerEmail: customerEmail,
        customerName: name,
        customerPhone: phone || "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating intro offer payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
