import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceType: 'ice_bath' | 'sauna' | 'combined';
  sessionDate: string;
  sessionTime: string;
  specialRequests?: string;
}

const serviceConfig = {
  ice_bath: { name: "Ice Bath Session", duration: 20, price: 3000 }, // £30.00
  sauna: { name: "Sauna Session", duration: 30, price: 2500 }, // £25.00
  combined: { name: "Combined Session", duration: 50, price: 4500 }, // £45.00
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      sessionDate,
      sessionTime,
      specialRequests
    }: BookingRequest = await req.json();

    // Validate required fields
    if (!customerName || !customerEmail || !serviceType || !sessionDate || !sessionTime) {
      throw new Error("Missing required booking information");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase client with service role for writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const service = serviceConfig[serviceType];
    if (!service) {
      throw new Error("Invalid service type");
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: service.name,
              description: `${service.duration} minute session on ${sessionDate} at ${sessionTime}`,
            },
            unit_amount: service.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/booking`,
      metadata: {
        type: "booking",
        customerName,
        customerEmail,
        serviceType,
        sessionDate,
        sessionTime,
      }
    });

    // Store booking in database
    const { error: bookingError } = await supabase
      .from("bookings")
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        service_type: serviceType,
        session_date: sessionDate,
        session_time: sessionTime,
        duration_minutes: service.duration,
        price_amount: service.price,
        stripe_session_id: session.id,
        special_requests: specialRequests,
        payment_status: "pending",
      });

    if (bookingError) {
      console.error("Error storing booking:", bookingError);
      throw new Error("Failed to store booking information");
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in create-booking-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});