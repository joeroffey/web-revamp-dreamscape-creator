import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancelRequest {
  bookingId: string;
}

type RefundType = "membership" | "token" | "credit" | "none";

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

    const { bookingId }: CancelRequest = await req.json();
    if (!bookingId) throw new Error("Missing bookingId");

    // Load booking
    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();
    if (bookErr || !booking) throw new Error("Booking not found");

    // Ownership: must match user_id OR the user's email
    const userEmail = (user.email || "").toLowerCase();
    const bookingEmail = (booking.customer_email || "").toLowerCase();
    if (booking.user_id !== user.id && bookingEmail !== userEmail) {
      throw new Error("You do not have permission to cancel this booking");
    }

    if (booking.payment_status === "cancelled") {
      return new Response(
        JSON.stringify({ success: true, message: "Booking already cancelled", refundType: "none" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Determine refund type
    const sr: string = booking.special_requests || "";
    const isMembership = sr.includes("[Membership booking]");
    const isCredit = sr.includes("[Credit booking]") || sr.includes("[Partial credit]");
    const isToken =
      !isMembership &&
      !isCredit &&
      (booking.discount_amount || 0) > 0 &&
      (booking.final_amount === 0 || booking.final_amount === null);
    const isPaidCash =
      !isMembership && !isCredit && !isToken && (booking.final_amount || 0) > 0;

    let refundType: RefundType = "none";
    let refundDetail = "";

    // 1) Update booking to cancelled
    const { error: updErr } = await supabase
      .from("bookings")
      .update({ payment_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (updErr) throw updErr;

    // 2) Free time slot
    if (booking.time_slot_id) {
      const { data: slot } = await supabase
        .from("time_slots")
        .select("booked_count")
        .eq("id", booking.time_slot_id)
        .single();
      if (booking.booking_type === "private") {
        await supabase
          .from("time_slots")
          .update({ booked_count: 0, is_available: true, updated_at: new Date().toISOString() })
          .eq("id", booking.time_slot_id);
      } else if (slot) {
        const guestCount = booking.guest_count || 1;
        const newCount = Math.max(0, (slot.booked_count || 0) - guestCount);
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

    // 3) Apply refund
    if (isMembership) {
      // Refund a session
      const { data: ms } = await supabase
        .from("memberships")
        .select("id, sessions_remaining, membership_type, status, end_date")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ms && ms.membership_type !== "unlimited") {
        await supabase
          .from("memberships")
          .update({
            sessions_remaining: (ms.sessions_remaining || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ms.id);
        refundType = "membership";
        refundDetail = "1 membership session has been added back to your account.";
      } else {
        refundType = "membership";
        refundDetail = "Your membership session has been released.";
      }
    } else if (isToken) {
      const { data: tokens } = await supabase
        .from("customer_tokens")
        .select("*")
        .eq("customer_email", userEmail)
        .order("expires_at", { ascending: true, nullsFirst: false })
        .limit(1);
      if (tokens && tokens.length > 0) {
        await supabase
          .from("customer_tokens")
          .update({
            tokens_remaining: tokens[0].tokens_remaining + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tokens[0].id);
      } else {
        await supabase.from("customer_tokens").insert({
          customer_email: userEmail,
          tokens_remaining: 1,
          notes: "Refunded from cancelled booking",
        });
      }
      refundType = "token";
      refundDetail = "1 session token has been returned to your account.";
    } else if (isCredit || isPaidCash) {
      // Credit refund of original amount paid
      const refundAmount = isCredit
        ? booking.price_amount || 0
        : booking.final_amount || 0;
      if (refundAmount > 0) {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        // Try to update existing credit row for this user
        const { data: existing } = await supabase
          .from("customer_credits")
          .select("*")
          .eq("user_id", user.id)
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existing) {
          await supabase
            .from("customer_credits")
            .update({
              credit_balance: (existing.credit_balance || 0) + refundAmount,
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("customer_credits").insert({
            user_id: user.id,
            customer_email: userEmail,
            credit_balance: refundAmount,
            expires_at: expiresAt.toISOString(),
          });
        }
        refundType = "credit";
        refundDetail = `£${(refundAmount / 100).toFixed(2)} credit has been added to your account (valid for 1 year).`;
      }
    }

    // 4) Send cancellation email (best effort)
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const resend = new Resend(resendKey);
        const dateStr = new Date(booking.session_date + "T00:00:00").toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        const timeStr = String(booking.session_time).slice(0, 5);
        await resend.emails.send({
          from: "Revitalise Hub <bookings@revitalisehub.co.uk>",
          to: [booking.customer_email],
          subject: "Your booking has been cancelled",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #52331F;">
              <h2 style="color:#52331F;">Booking cancelled</h2>
              <p>Hi ${booking.customer_name?.split(" ")[0] || "there"},</p>
              <p>Your booking on <strong>${dateStr}</strong> at <strong>${timeStr}</strong> has been cancelled.</p>
              ${refundDetail ? `<p>${refundDetail}</p>` : ""}
              <p>You can rebook anytime at <a href="https://www.revitalisehub.co.uk/booking">revitalisehub.co.uk/booking</a>.</p>
              <p>— The Revitalise Hub Team</p>
            </div>
          `,
        });
      }
    } catch (e) {
      console.error("Cancellation email failed:", e);
    }

    return new Response(
      JSON.stringify({ success: true, refundType, refundDetail }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("user-cancel-booking error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
