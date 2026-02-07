import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PartialCreditBookingRequest {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  timeSlotId: string;
  specialRequests?: string;
  bookingType: "communal" | "private";
  guestCount: number;
  applyCredit: boolean;
  discountCode?: string;
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
      guestCount,
      applyCredit,
      discountCode
    }: PartialCreditBookingRequest = await req.json();

    // Verify user matches
    if (userId !== user.id) {
      throw new Error("User ID mismatch");
    }

    // Get the time slot
    const { data: timeSlot, error: slotError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', timeSlotId)
      .eq('is_available', true)
      .single();

    if (slotError || !timeSlot) {
      throw new Error("Time slot not available or does not exist");
    }

    // Get pricing
    const { data: pricingData } = await supabase
      .from('pricing_config')
      .select('service_type, price_amount')
      .eq('is_active', true)
      .in('service_type', ['combined', 'private']);

    const pricing = { combined: 1800, private: 7000 };
    if (pricingData) {
      pricingData.forEach(p => {
        if (p.service_type === 'combined') pricing.combined = p.price_amount;
        if (p.service_type === 'private') pricing.private = p.price_amount;
      });
    }

    // Calculate base booking cost
    const baseAmount = bookingType === 'private' 
      ? pricing.private 
      : pricing.combined * guestCount;

    // Apply discount code if provided
    let discountCodeRow: any = null;
    let partnerCodeRow: any = null;
    let discountFromCode = 0;

    if (discountCode && discountCode.trim().length > 0) {
      const code = discountCode.trim().toUpperCase();
      
      // Check discount_codes table
      const { data: dc } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle();
      
      if (dc && dc.is_active) {
        discountCodeRow = dc;
        if (dc.discount_type === 'percentage') {
          discountFromCode = Math.round(baseAmount * (dc.discount_value / 100));
        } else {
          discountFromCode = Math.min(baseAmount, dc.discount_value);
        }
      } else {
        // Check partner_codes table
        const { data: pc } = await supabase
          .from('partner_codes')
          .select('*')
          .eq('promo_code', code)
          .eq('is_active', true)
          .maybeSingle();
        
        if (pc) {
          partnerCodeRow = pc;
          discountFromCode = Math.round(baseAmount * (pc.discount_percentage / 100));
        }
      }
    }

    const amountAfterPromo = Math.max(0, baseAmount - discountFromCode);

    // Get user's credits if applying
    let creditAmount = 0;
    let creditsToDeduct: Array<{ id: string; amount: number }> = [];

    if (applyCredit) {
      const { data: credits } = await supabase
        .from('customer_credits')
        .select('*')
        .eq('user_id', user.id)
        .gt('credit_balance', 0)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

      if (credits && credits.length > 0) {
        let remainingToDeduct = amountAfterPromo;
        
        for (const credit of credits) {
          if (remainingToDeduct <= 0) break;
          
          const deduction = Math.min(credit.credit_balance, remainingToDeduct);
          creditAmount += deduction;
          creditsToDeduct.push({ id: credit.id, amount: deduction });
          remainingToDeduct -= deduction;
        }
      }
    }

    const amountToPay = Math.max(0, amountAfterPromo - creditAmount);

    // Check booking conflicts
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("booking_type, guest_count, payment_status")
      .eq("time_slot_id", timeSlotId)
      .eq("payment_status", "paid");

    const confirmedBookings = existingBookings || [];
    const communalBookings = confirmedBookings.filter(b => b.booking_type === 'communal');
    const privateBookings = confirmedBookings.filter(b => b.booking_type === 'private');
    const totalCommunalGuests = communalBookings.reduce((sum, b) => sum + (b.guest_count || 0), 0);
    const hasPrivateBooking = privateBookings.length > 0;

    if (bookingType === 'private') {
      if (hasPrivateBooking || totalCommunalGuests > 0) {
        throw new Error("Time slot not available for private booking");
      }
    } else {
      if (hasPrivateBooking) {
        throw new Error("Time slot not available - private booking exists");
      }
      if (totalCommunalGuests + guestCount > 5) {
        throw new Error(`Not enough space - only ${5 - totalCommunalGuests} spaces remaining`);
      }
    }

    // If there's nothing to pay (credits cover everything), create booking directly
    if (amountToPay === 0) {
      // Deduct credits
      for (const { id, amount } of creditsToDeduct) {
        const { data: currentCredit } = await supabase
          .from('customer_credits')
          .select('credit_balance')
          .eq('id', id)
          .single();
        
        if (currentCredit) {
          await supabase
            .from('customer_credits')
            .update({ 
              credit_balance: currentCredit.credit_balance - amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
        }
      }

      // Create confirmed booking
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
          price_amount: baseAmount,
          discount_code_id: discountCodeRow?.id || null,
          discount_amount: discountFromCode + creditAmount,
          final_amount: 0,
          guest_count: guestCount,
          booking_type: bookingType,
          special_requests: specialRequests || null,
          payment_status: 'paid',
        })
        .select()
        .single();

      if (bookingError) throw new Error("Failed to create booking");

      // Update time slot
      if (bookingType === 'private') {
        await supabase
          .from('time_slots')
          .update({ is_available: false, booked_count: 5, updated_at: new Date().toISOString() })
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
          creditsUsed: creditAmount,
          creditsRemaining: totalRemainingCredits,
          paidWithCreditsOnly: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Otherwise, create Stripe checkout for remaining amount
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const sessionName = bookingType === 'private' ? 'Private Session' : 'Communal Session';
    const creditDescription = creditAmount > 0 
      ? ` (£${(creditAmount / 100).toFixed(2)} credit applied)`
      : '';

    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${sessionName}${creditDescription}`,
              description: `Session on ${timeSlot.slot_date} at ${timeSlot.slot_time} for ${guestCount} ${guestCount === 1 ? 'person' : 'people'}`,
            },
            unit_amount: amountToPay,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/booking`,
      metadata: {
        type: "partial_credit_booking",
        userId: userId,
        timeSlotId: timeSlotId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || "",
        bookingType,
        guestCount: guestCount.toString(),
        specialRequests: specialRequests || "",
        discountCode: discountCodeRow?.code || partnerCodeRow?.promo_code || "",
        discountCodeId: discountCodeRow?.id || "",
        partnerCodeId: partnerCodeRow?.id || "",
        baseAmount: baseAmount.toString(),
        discountFromCode: discountFromCode.toString(),
        creditAmount: creditAmount.toString(),
        amountToPay: amountToPay.toString(),
        creditsToDeduct: JSON.stringify(creditsToDeduct),
      }
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error creating partial credit booking:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

