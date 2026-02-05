import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancelBookingRequest {
  bookingId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CancelBookingRequest = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      throw new Error("Missing booking ID");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Only cancel if not already cancelled
    if (booking.payment_status === 'cancelled') {
      return new Response(
        JSON.stringify({ success: true, message: "Booking already cancelled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if this was a token/membership booking (free booking - final_amount is 0 or null)
    const wasTokenBooking = booking.payment_status === 'paid' && 
      (booking.final_amount === 0 || booking.final_amount === null) &&
      booking.discount_amount > 0;

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        booking_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // Update time slot availability if booking had a time_slot_id
    if (booking.time_slot_id && booking.payment_status === 'paid') {
      const guestCount = booking.guest_count || 1;
      
      // Get current time slot
      const { data: timeSlot, error: slotError } = await supabase
        .from('time_slots')
        .select('booked_count')
        .eq('id', booking.time_slot_id)
        .single();

      if (!slotError && timeSlot) {
        const newBookedCount = Math.max(0, (timeSlot.booked_count || 0) - guestCount);
        
        await supabase
          .from('time_slots')
          .update({
            booked_count: newBookedCount,
            is_available: newBookedCount < 5,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.time_slot_id);
      }
    }

    // Refund token if this was a token booking
    let tokenRefunded = false;
    if (wasTokenBooking && booking.customer_email) {
      const normalizedEmail = booking.customer_email.trim().toLowerCase();
      
      // Find the customer's token record and add back the token
      const { data: tokens, error: tokenError } = await supabase
        .from('customer_tokens')
        .select('*')
        .eq('customer_email', normalizedEmail)
        .order('expires_at', { ascending: true, nullsFirst: false })
        .limit(1);

      if (!tokenError && tokens && tokens.length > 0) {
        // Add the token back to the first matching record
        const tokenRecord = tokens[0];
        await supabase
          .from('customer_tokens')
          .update({
            tokens_remaining: tokenRecord.tokens_remaining + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', tokenRecord.id);
        tokenRefunded = true;
      } else {
        // No existing token record, create one to hold the refunded token
        await supabase
          .from('customer_tokens')
          .insert({
            customer_email: normalizedEmail,
            tokens_remaining: 1,
            notes: 'Refunded from cancelled booking',
          });
        tokenRefunded = true;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Booking cancelled successfully",
        tokenRefunded,
        slotsFreed: booking.guest_count || 1
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error cancelling booking:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
