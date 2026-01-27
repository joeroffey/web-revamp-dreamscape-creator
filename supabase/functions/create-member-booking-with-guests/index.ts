import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MemberBookingWithGuestsRequest {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  timeSlotId: string;
  specialRequests?: string;
  payingGuestCount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: MemberBookingWithGuestsRequest = await req.json();
    const { userId, customerName, customerEmail, customerPhone, timeSlotId, specialRequests, payingGuestCount } = body;

    if (!userId || !customerName || !customerEmail || !timeSlotId || payingGuestCount < 1) {
      throw new Error("Missing required fields");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check membership
    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1);

    if (membershipError) throw membershipError;
    if (!memberships || memberships.length === 0) {
      throw new Error("No active membership found");
    }

    const membership = memberships[0];
    const isUnlimited = membership.membership_type === 'unlimited' || membership.sessions_per_week === 999;

    if (!isUnlimited && membership.sessions_remaining < 1) {
      throw new Error("No sessions remaining this week");
    }

    // Get time slot
    const { data: timeSlot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', timeSlotId)
      .single();

    if (slotError || !timeSlot) throw new Error("Time slot not found");

    // Check if member already booked this date
    const { data: existingMemberBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('session_date', timeSlot.slot_date)
      .eq('payment_status', 'paid');

    if (existingMemberBookings && existingMemberBookings.length > 0) {
      throw new Error("You already have a booking on this date");
    }

    // Check availability (exclude cancelled bookings)
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('booking_type, guest_count, booking_status')
      .eq('time_slot_id', timeSlotId)
      .eq('payment_status', 'paid')
      .neq('booking_status', 'cancelled');

    const hasPrivateBooking = existingBookings?.some(b => b.booking_type === 'private');
    const currentCommunalCount = existingBookings?.filter(b => b.booking_type === 'communal')
      .reduce((sum, b) => sum + (b.guest_count || 1), 0) || 0;

    const totalNeeded = 1 + payingGuestCount; // Member + paying guests
    const remainingSpaces = 5 - currentCommunalCount;
    if (hasPrivateBooking || totalNeeded > remainingSpaces) {
      throw new Error(`Not enough spaces available. Only ${remainingSpaces} spaces remaining for this slot.`);
    }

    // Get pricing
    const { data: pricingData } = await supabase
      .from("pricing_config")
      .select("price_amount")
      .eq("service_type", "combined")
      .eq("is_active", true)
      .single();

    const pricePerPerson = pricingData?.price_amount || 1800;
    const guestTotalAmount = pricePerPerson * payingGuestCount;

    // Create Stripe session for guest payment
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Guest Sessions (${payingGuestCount} ${payingGuestCount === 1 ? 'guest' : 'guests'})`,
            description: `Communal session on ${timeSlot.slot_date} at ${timeSlot.slot_time} - Member + ${payingGuestCount} paying guests`,
          },
          unit_amount: guestTotalAmount,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/booking-success?session_id={CHECKOUT_SESSION_ID}&membership=true`,
      cancel_url: `${req.headers.get("origin")}/booking`,
      metadata: {
        type: "member_booking_with_guests",
        userId,
        membershipId: membership.id,
        timeSlotId,
        customerName,
        customerEmail,
        payingGuestCount: payingGuestCount.toString(),
        totalGuestCount: totalNeeded.toString(),
      }
    });

    // Store pending booking
    await supabase.from("bookings").insert({
      user_id: userId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      service_type: "combined",
      session_date: timeSlot.slot_date,
      session_time: timeSlot.slot_time,
      duration_minutes: 60,
      price_amount: guestTotalAmount,
      stripe_session_id: session.id,
      time_slot_id: timeSlotId,
      special_requests: specialRequests,
      payment_status: "pending",
      booking_type: "communal",
      guest_count: totalNeeded,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
