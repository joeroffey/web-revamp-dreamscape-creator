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
  timeSlotId: string;
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
      timeSlotId,
      specialRequests
    }: BookingRequest = await req.json();

    // Validate required fields
    if (!customerName || !customerEmail || !timeSlotId) {
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

    // Get time slot details and check availability
    const { data: timeSlot, error: slotError } = await supabase
      .from("time_slots")
      .select("*")
      .eq("id", timeSlotId)
      .eq("is_available", true)
      .single();

    if (slotError || !timeSlot) {
      throw new Error("Time slot not available or does not exist");
    }

    const service = serviceConfig[timeSlot.service_type as keyof typeof serviceConfig];
    if (!service) {
      throw new Error("Invalid service type");
    }

    // Reserve the slot temporarily by incrementing booked count
    const { error: reserveError } = await supabase
      .from("time_slots")
      .update({ 
        booked_count: timeSlot.booked_count + 1,
        is_available: timeSlot.booked_count + 1 >= timeSlot.capacity ? false : true
      })
      .eq("id", timeSlotId)
      .eq("booked_count", timeSlot.booked_count); // Optimistic locking

    if (reserveError) {
      throw new Error("Unable to reserve time slot - may have been booked by someone else");
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
              description: `${service.duration} minute session on ${timeSlot.slot_date} at ${timeSlot.slot_time}`,
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
        timeSlotId: timeSlotId,
        customerName,
        customerEmail,
      }
    });

    // Store booking in database
    const { error: bookingError } = await supabase
      .from("bookings")
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        service_type: timeSlot.service_type,
        session_date: timeSlot.slot_date,
        session_time: timeSlot.slot_time,
        duration_minutes: service.duration,
        price_amount: service.price,
        stripe_session_id: session.id,
        time_slot_id: timeSlotId,
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