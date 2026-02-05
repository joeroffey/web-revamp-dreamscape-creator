import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreditBookingRequest {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  timeSlotId: string;
  specialRequests?: string;
  bookingType: "communal" | "private";
  guestCount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify user authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Authentication required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid authentication");
    }

    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      timeSlotId,
      specialRequests,
      bookingType,
      guestCount
    }: CreditBookingRequest = await req.json();

    // Verify user matches
    if (userId !== user.id) {
      throw new Error("User ID mismatch");
    }

    // Get pricing
    const { data: pricingData } = await supabase
      .from('pricing_config')
      .select('price_amount')
      .eq('service_type', bookingType === 'private' ? 'private' : 'combined')
      .eq('is_active', true)
      .single();

    const pricePerPerson = pricingData?.price_amount || (bookingType === 'private' ? 7000 : 1800);
    const totalCost = bookingType === 'private' ? pricePerPerson : pricePerPerson * guestCount;

    // Get user's credits (non-expired, with balance, ordered by expiry)
    const { data: credits, error: creditsError } = await supabase
      .from('customer_credits')
      .select('*')
      .eq('user_id', user.id)
      .gt('credit_balance', 0)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (creditsError) {
      throw new Error("Failed to fetch credits");
    }

    const totalCredits = (credits || []).reduce((sum, c) => sum + c.credit_balance, 0);

    // Check if user has enough credits
    // Rule: Can only use partial credit if remaining balance < total cost
    // e.g., £10 left and order is £18 - can use (pay £8 difference)
    // But if £20 left and order is £18 - must use £18 worth
    if (totalCredits < totalCost) {
      throw new Error(`Insufficient credits. You have £${(totalCredits / 100).toFixed(2)} but need £${(totalCost / 100).toFixed(2)}. Partial credit payments require the credit balance to be less than the booking cost.`);
    }

    // Get the time slot
    const { data: timeSlot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', timeSlotId)
      .single();

    if (slotError || !timeSlot) {
      throw new Error("Time slot not found");
    }

    // Check availability
    if (!timeSlot.is_available) {
      throw new Error("This time slot is no longer available");
    }

    // For private bookings, check if slot is empty
    if (bookingType === 'private') {
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('time_slot_id', timeSlotId)
        .in('payment_status', ['paid', 'pending']);

      if (existingBookings && existingBookings.length > 0) {
        throw new Error("Private booking requires an empty time slot");
      }
    }

    // For communal, check capacity
    if (bookingType === 'communal') {
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('guest_count, booking_type')
        .eq('time_slot_id', timeSlotId)
        .eq('payment_status', 'paid');

      const currentCount = (existingBookings || []).reduce((sum, b) => {
        if (b.booking_type === 'private') return 5; // Private takes all
        return sum + b.guest_count;
      }, 0);

      if (currentCount + guestCount > 5) {
        throw new Error(`Not enough space. Only ${5 - currentCount} spots available.`);
      }
    }

    // Deduct credits from oldest first
    let remainingCost = totalCost;
    for (const credit of credits || []) {
      if (remainingCost <= 0) break;

      const deduction = Math.min(credit.credit_balance, remainingCost);
      const newBalance = credit.credit_balance - deduction;

      await supabase
        .from('customer_credits')
        .update({ 
          credit_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', credit.id);

      remainingCost -= deduction;
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        customer_name: customerName,
        customer_email: customerEmail.toLowerCase(),
        customer_phone: customerPhone || null,
        time_slot_id: timeSlotId,
        service_type: 'combined',
        session_date: timeSlot.slot_date,
        session_time: timeSlot.slot_time,
        duration_minutes: 60,
        price_amount: totalCost,
        discount_amount: 0,
        final_amount: 0, // Paid with credits
        guest_count: guestCount,
        booking_type: bookingType,
        special_requests: specialRequests || null,
        payment_status: 'paid',
        booking_status: 'confirmed'
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking error:", bookingError);
      throw new Error("Failed to create booking");
    }

    // Update time slot availability
    if (bookingType === 'private') {
      await supabase
        .from('time_slots')
        .update({
          is_available: false,
          booked_count: 5,
          updated_at: new Date().toISOString()
        })
        .eq('id', timeSlotId);
    } else {
      const newBookedCount = (timeSlot.booked_count || 0) + guestCount;
      await supabase
        .from('time_slots')
        .update({
          booked_count: newBookedCount,
          is_available: newBookedCount < 5,
          updated_at: new Date().toISOString()
        })
        .eq('id', timeSlotId);
    }

    // Get remaining credits
    const { data: remainingCredits } = await supabase
      .from('customer_credits')
      .select('credit_balance')
      .eq('user_id', user.id)
      .gt('credit_balance', 0)
      .gt('expires_at', new Date().toISOString());

    const totalRemainingCredits = (remainingCredits || []).reduce((sum, c) => sum + c.credit_balance, 0);

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: booking.id,
        creditsUsed: totalCost,
        creditsRemaining: totalRemainingCredits
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error creating credit booking:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
