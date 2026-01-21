import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MemberBookingRequest {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  timeSlotId: string;
  specialRequests?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: MemberBookingRequest = await req.json();
    const { userId, customerName, customerEmail, customerPhone, timeSlotId, specialRequests } = body;

    if (!userId || !customerName || !customerEmail || !timeSlotId) {
      throw new Error("Missing required fields");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check user has an active membership with available credits
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

    // Check if member has remaining credits (unless unlimited)
    if (!isUnlimited && membership.sessions_remaining < 1) {
      throw new Error("No sessions remaining this week. Your credits reset every Monday.");
    }

    // Get time slot details
    const { data: timeSlot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', timeSlotId)
      .single();

    if (slotError || !timeSlot) {
      throw new Error("Time slot not found");
    }

    // RESTRICTION: Check if member already used their FREE membership credit for this date
    // A membership-used booking has final_amount = 0 or null
    const { data: existingMembershipBookings, error: memberBookingsError } = await supabase
      .from('bookings')
      .select('id, session_date, session_time, final_amount')
      .eq('user_id', userId)
      .eq('session_date', timeSlot.slot_date)
      .eq('payment_status', 'paid')
      .or('final_amount.eq.0,final_amount.is.null');

    if (memberBookingsError) throw memberBookingsError;

    if (existingMembershipBookings && existingMembershipBookings.length > 0) {
      const existingBooking = existingMembershipBookings[0];
      throw new Error(`You've already used your free membership session on this date at ${existingBooking.session_time.slice(0, 5)}. You can still book another session but will need to pay the standard rate.`);
    }

    // Check slot availability for communal booking (members always book communal for themselves)
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('booking_type, guest_count')
      .eq('time_slot_id', timeSlotId)
      .eq('payment_status', 'paid');

    if (bookingsError) throw bookingsError;

    const hasPrivateBooking = existingBookings?.some(b => b.booking_type === 'private');
    const currentCommunalCount = existingBookings?.filter(b => b.booking_type === 'communal')
      .reduce((sum, b) => sum + (b.guest_count || 1), 0) || 0;

    // Members can only book 1 spot for themselves via membership
    if (hasPrivateBooking) {
      throw new Error("Time slot has been booked privately");
    }
    if (currentCommunalCount >= 5) {
      throw new Error("No spaces available for this time slot");
    }

    // Create the booking - ALWAYS 1 guest for member bookings, FREE (final_amount = 0)
    const priceAmount = 1800; // Standard communal price for reference
    
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        time_slot_id: timeSlotId,
        session_date: timeSlot.slot_date,
        session_time: timeSlot.slot_time,
        service_type: 'combined',
        duration_minutes: 60,
        price_amount: priceAmount,
        final_amount: 0, // Free via membership
        discount_amount: priceAmount, // Full discount applied
        booking_type: 'communal',
        guest_count: 1, // Members can only book for themselves
        special_requests: specialRequests || null,
        payment_status: 'paid',
        booking_status: 'confirmed'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update time slot availability
    const newCommunalCount = currentCommunalCount + 1;

    await supabase
      .from('time_slots')
      .update({
        booked_count: newCommunalCount,
        is_available: newCommunalCount < 5,
        updated_at: new Date().toISOString()
      })
      .eq('id', timeSlotId);

    // Decrement sessions remaining (unless unlimited)
    if (!isUnlimited) {
      await supabase
        .from('memberships')
        .update({
          sessions_remaining: membership.sessions_remaining - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', membership.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking: booking,
        sessionsRemaining: isUnlimited ? 'unlimited' : membership.sessions_remaining - 1
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error creating member booking:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
