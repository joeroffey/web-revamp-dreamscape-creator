import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RescheduleRequest {
  bookingId: string;
  newTimeSlotId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Authentication required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) throw new Error("Invalid authentication");
    const user = userData.user;

    const { bookingId, newTimeSlotId }: RescheduleRequest = await req.json();
    if (!bookingId || !newTimeSlotId) throw new Error("Missing parameters");

    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();
    if (bookErr || !booking) throw new Error("Booking not found");

    const userEmail = (user.email || "").toLowerCase();
    if (booking.user_id !== user.id && (booking.customer_email || "").toLowerCase() !== userEmail) {
      throw new Error("You do not have permission to amend this booking");
    }

    if (booking.payment_status === "cancelled") {
      throw new Error("Cannot reschedule a cancelled booking");
    }

    if (newTimeSlotId === booking.time_slot_id) {
      throw new Error("Please select a different time slot");
    }

    // Load new slot
    const { data: newSlot, error: slotErr } = await supabase
      .from("time_slots")
      .select("*")
      .eq("id", newTimeSlotId)
      .single();
    if (slotErr || !newSlot) throw new Error("Selected time slot not found");

    // Validate capacity using paid bookings on the new slot
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("booking_type, guest_count, payment_status")
      .eq("time_slot_id", newTimeSlotId)
      .eq("payment_status", "paid");

    const hasPrivate = (existingBookings || []).some((b) => b.booking_type === "private");
    const communalCount = (existingBookings || [])
      .filter((b) => b.booking_type === "communal")
      .reduce((sum, b) => sum + (b.guest_count || 0), 0);

    const guestCount = booking.guest_count || 1;
    if (booking.booking_type === "private") {
      if ((existingBookings || []).length > 0) {
        throw new Error("This slot is no longer available for a private booking");
      }
    } else {
      if (hasPrivate) throw new Error("This slot has been booked privately");
      if (communalCount + guestCount > 5) {
        throw new Error("Not enough spaces available in this slot");
      }
    }

    // Free old slot
    if (booking.time_slot_id) {
      const { data: oldSlot } = await supabase
        .from("time_slots")
        .select("booked_count")
        .eq("id", booking.time_slot_id)
        .single();
      if (booking.booking_type === "private") {
        await supabase
          .from("time_slots")
          .update({ booked_count: 0, is_available: true, updated_at: new Date().toISOString() })
          .eq("id", booking.time_slot_id);
      } else if (oldSlot) {
        const newCount = Math.max(0, (oldSlot.booked_count || 0) - guestCount);
        await supabase
          .from("time_slots")
          .update({
            booked_count: newCount,
            is_available: newCount < 5,
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking.time_slot_id);
      }
    }

    // Occupy new slot
    if (booking.booking_type === "private") {
      await supabase
        .from("time_slots")
        .update({ booked_count: 5, is_available: false, updated_at: new Date().toISOString() })
        .eq("id", newTimeSlotId);
    } else {
      const newCount = communalCount + guestCount;
      await supabase
        .from("time_slots")
        .update({
          booked_count: newCount,
          is_available: newCount < 5,
          updated_at: new Date().toISOString(),
        })
        .eq("id", newTimeSlotId);
    }

    // Update booking row
    const { error: updErr } = await supabase
      .from("bookings")
      .update({
        time_slot_id: newTimeSlotId,
        session_date: newSlot.slot_date,
        session_time: newSlot.slot_time,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);
    if (updErr) throw updErr;

    // Send updated booking email (best effort)
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const resend = new Resend(resendKey);
        const dateStr = new Date(newSlot.slot_date + "T00:00:00").toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        const timeStr = String(newSlot.slot_time).slice(0, 5);
        await resend.emails.send({
          from: "Revitalise Hub <bookings@revitalisehub.co.uk>",
          to: [booking.customer_email],
          subject: "Your booking has been updated",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#52331F;">
              <h2 style="color:#52331F;">Booking rescheduled</h2>
              <p>Hi ${booking.customer_name?.split(" ")[0] || "there"},</p>
              <p>Your booking has been moved to <strong>${dateStr}</strong> at <strong>${timeStr}</strong>.</p>
              <p>We look forward to seeing you.</p>
              <p>— The Revitalise Hub Team</p>
            </div>
          `,
        });
      }
    } catch (e) {
      console.error("Reschedule email failed:", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        newDate: newSlot.slot_date,
        newTime: newSlot.slot_time,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("user-reschedule-booking error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
