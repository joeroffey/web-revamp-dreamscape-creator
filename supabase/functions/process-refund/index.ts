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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // AuthZ: admin only
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authToken = authHeader.replace("Bearer ", "");
    const { data: authData, error: authErr } = await supabase.auth.getUser(authToken);
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: adminRole } = await supabase
      .from("user_roles").select("role").eq("user_id", authData.user.id).eq("role", "admin").maybeSingle();
    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { bookingId, refundType = "full" } = await req.json();

    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    if (!booking.stripe_session_id) {
      throw new Error("No Stripe session found for this booking");
    }

    if (booking.payment_status !== "paid") {
      throw new Error("Booking has not been paid");
    }

    // Get the Stripe session to find the payment intent
    const session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
    
    if (!session.payment_intent) {
      throw new Error("No payment intent found for this session");
    }

    const paymentIntentId = typeof session.payment_intent === "string" 
      ? session.payment_intent 
      : session.payment_intent.id;

    // Process the refund
    const refundAmount = refundType === "full" 
      ? undefined // Full refund
      : Math.round((booking.final_amount || booking.price_amount) / 2); // Partial refund (50%)

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
    });

    console.log("Refund processed:", refund.id);

    // Update booking status
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_status: refundType === "full" ? "refunded" : "partial_refund",
        booking_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Error updating booking:", updateError);
      throw new Error("Refund processed but failed to update booking status");
    }

    // Recompute the time slot's booked_count from bookings as source of truth
    if (booking.time_slot_id) {
      const { data: activeBookings } = await supabase
        .from("bookings")
        .select("booking_type, guest_count")
        .eq("time_slot_id", booking.time_slot_id)
        .eq("payment_status", "paid")
        .neq("booking_status", "cancelled");

      const hasPrivate = activeBookings?.some((b) => b.booking_type === "private");
      const communalCount = activeBookings
        ?.filter((b) => b.booking_type === "communal")
        .reduce((sum, b) => sum + (b.guest_count || 1), 0) || 0;

      // Private counts as 5 (fills the slot)
      const recomputedCount = hasPrivate ? 5 : communalCount;
      const isAvailable = !hasPrivate && recomputedCount < 5;

      await supabase
        .from("time_slots")
        .update({
          booked_count: recomputedCount,
          is_available: isAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.time_slot_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        refundAmount: refund.amount,
        status: refund.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Refund error:", error);
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
