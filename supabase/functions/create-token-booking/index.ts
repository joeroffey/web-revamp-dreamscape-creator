import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenBookingRequest {
  userId?: string;
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
    const body: TokenBookingRequest = await req.json();
    const { userId, customerName, customerEmail, customerPhone, timeSlotId, specialRequests } = body;

    if (!customerName || !customerEmail || !timeSlotId) {
      throw new Error("Missing required fields");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const normalizedEmail = customerEmail.trim().toLowerCase();
    const now = new Date().toISOString();

    // Get valid tokens for this customer (prioritize earliest expiry)
    const { data: tokens, error: tokenError } = await supabase
      .from('customer_tokens')
      .select('*')
      .eq('customer_email', normalizedEmail)
      .gt('tokens_remaining', 0)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('expires_at', { ascending: true, nullsFirst: false });

    if (tokenError) throw tokenError;
    if (!tokens || tokens.length === 0) {
      throw new Error("No valid tokens available. Please purchase more sessions or use standard booking.");
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

    // RESTRICTION: Check if user already used a token for this date (1 token per day)
    // Any free booking (final_amount = 0 or null) counts as a token usage for this restriction
    const { data: existingFreeBookings, error: freeBookingsError } = await supabase
      .from('bookings')
      .select('id, session_date, session_time, final_amount')
      .eq('customer_email', normalizedEmail)
      .eq('session_date', timeSlot.slot_date)
      .eq('payment_status', 'paid')
      .or('final_amount.eq.0,final_amount.is.null');

    if (freeBookingsError) throw freeBookingsError;

    // If any free booking exists for this date, block the token booking
    if (existingFreeBookings && existingFreeBookings.length > 0) {
      const existingBooking = existingFreeBookings[0];
      throw new Error(`You've already used a free session on this date at ${existingBooking.session_time.slice(0, 5)}. You can only use 1 token per day. Select a different date or pay the standard rate.`);
    }

    // Check slot availability for communal booking (tokens are only for communal)
    // Exclude cancelled bookings from the count
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('booking_type, guest_count, booking_status')
      .eq('time_slot_id', timeSlotId)
      .eq('payment_status', 'paid')
      .neq('booking_status', 'cancelled');

    if (bookingsError) throw bookingsError;

    const hasPrivateBooking = existingBookings?.some(b => b.booking_type === 'private');
    const currentCommunalCount = existingBookings?.filter(b => b.booking_type === 'communal')
      .reduce((sum, b) => sum + (b.guest_count || 1), 0) || 0;

    if (hasPrivateBooking) {
      throw new Error("Time slot has been booked privately");
    }
    if (currentCommunalCount >= 5) {
      throw new Error("No spaces available for this time slot");
    }

    // Use token from the first batch (earliest expiry)
    const tokenToUse = tokens[0];
    
    // Create the booking - 1 person, FREE via token
    const priceAmount = 1800; // Standard communal price for reference
    
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId || null,
        customer_name: customerName,
        customer_email: normalizedEmail,
        customer_phone: customerPhone || null,
        time_slot_id: timeSlotId,
        session_date: timeSlot.slot_date,
        session_time: timeSlot.slot_time,
        service_type: 'combined',
        duration_minutes: 60,
        price_amount: priceAmount,
        final_amount: 0, // Free via token
        discount_amount: priceAmount, // Full discount applied
        booking_type: 'communal',
        guest_count: 1, // Token bookings are for 1 person only
        special_requests: specialRequests || null,
        payment_status: 'paid',
        booking_status: 'confirmed'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Deduct token
    const newTokenCount = tokenToUse.tokens_remaining - 1;
    
    const { error: updateError } = await supabase
      .from('customer_tokens')
      .update({
        tokens_remaining: newTokenCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenToUse.id);

    if (updateError) {
      console.error("Error updating tokens:", updateError);
      // Don't throw - booking was created successfully
    }

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

    // Calculate total remaining tokens across all batches
    const totalRemainingTokens = tokens.reduce((sum, t) => sum + t.tokens_remaining, 0) - 1;

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking: booking,
        tokensRemaining: totalRemainingTokens,
        isIntroOffer: tokenToUse.notes?.includes('Introductory Offer')
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error creating token booking:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
