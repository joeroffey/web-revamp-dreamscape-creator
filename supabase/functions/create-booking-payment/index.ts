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
  bookingType: 'communal' | 'private';
  guestCount: number;
  discountCode?: string;
}

// Default prices - will be overridden by database values
const defaultPricing = {
  combined: 1800, // £18.00 per person communal
  private: 7000,  // £70.00 flat rate private
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
      specialRequests,
      bookingType = 'communal',
      guestCount = 1,
      discountCode
    }: BookingRequest = await req.json();

    // Validate required fields
    if (!customerName || !customerEmail || !timeSlotId || !bookingType || guestCount < 1) {
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

    // Fetch pricing from database
    const { data: pricingData } = await supabase
      .from("pricing_config")
      .select("service_type, price_amount")
      .eq("is_active", true)
      .in("service_type", ["combined", "private"]);

    // Build pricing map with database values or fallback to defaults
    const pricing = {
      combined: defaultPricing.combined,
      private: defaultPricing.private,
    };
    
    if (pricingData) {
      pricingData.forEach((p) => {
        if (p.service_type === "combined") pricing.combined = p.price_amount;
        if (p.service_type === "private") pricing.private = p.price_amount;
      });
    }

    // Check booking conflicts based on type
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("booking_type, guest_count")
      .eq("time_slot_id", timeSlotId)
      .eq("payment_status", "paid");

    const confirmedBookings = existingBookings || [];
    const communalBookings = confirmedBookings.filter(b => b.booking_type === 'communal');
    const privateBookings = confirmedBookings.filter(b => b.booking_type === 'private');
    const totalCommunalGuests = communalBookings.reduce((sum, b) => sum + (b.guest_count || 0), 0);
    const hasPrivateBooking = privateBookings.length > 0;

    // Validate booking based on type
    if (bookingType === 'private') {
      if (hasPrivateBooking || totalCommunalGuests > 0) {
        throw new Error("Time slot not available for private booking");
      }
    } else { // communal
      if (hasPrivateBooking) {
        throw new Error("Time slot not available - private booking exists");
      }
      if (totalCommunalGuests + guestCount > 5) {
        throw new Error(`Not enough space - only ${5 - totalCommunalGuests} spaces remaining`);
      }
    }

    // Calculate original amount (pence) using database pricing
    const originalAmount = bookingType === 'private' ? pricing.private : (pricing.combined * guestCount);

    // Optional: validate and apply discount code (check both discount_codes and partner_codes tables)
    let discountCodeRow: any = null;
    let partnerCodeRow: any = null;
    let discountAmount = 0;
    
    if (discountCode && discountCode.trim().length > 0) {
      const code = discountCode.trim().toUpperCase();
      
      // First check discount_codes table
      const { data: dc, error: dcErr } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (dcErr) throw dcErr;
      
      if (dc) {
        // Validate discount code
        const now = new Date();
        const validFromOk = !dc.valid_from || new Date(dc.valid_from) <= now;
        const validUntilOk = !dc.valid_until || new Date(dc.valid_until) >= now;
        const activeOk = dc.is_active !== false;
        const usesOk = !dc.max_uses || (dc.current_uses || 0) < dc.max_uses;
        const minOk = !dc.min_amount || originalAmount >= dc.min_amount;
        if (!activeOk || !validFromOk || !validUntilOk || !usesOk || !minOk) {
          throw new Error('Discount code is not valid for this booking');
        }

        discountCodeRow = dc;
        if (dc.discount_type === 'percentage') {
          discountAmount = Math.round(originalAmount * (dc.discount_value / 100));
        } else {
          discountAmount = Math.min(originalAmount, dc.discount_value);
        }
      } else {
        // Check partner_codes table
        const { data: pc, error: pcErr } = await supabase
          .from('partner_codes')
          .select('*')
          .eq('promo_code', code)
          .eq('is_active', true)
          .maybeSingle();

        if (pcErr) throw pcErr;
        
        if (pc) {
          partnerCodeRow = pc;
          discountAmount = Math.round(originalAmount * (pc.discount_percentage / 100));
        } else {
          throw new Error('Invalid promo code');
        }
      }
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    // Build discount description for Stripe
    const discountLabel = discountCodeRow 
      ? discountCodeRow.code 
      : partnerCodeRow 
        ? `${partnerCodeRow.company_name} (${partnerCodeRow.promo_code})`
        : '';

    // Create Stripe checkout session
    const sessionName = bookingType === 'private' ? 'Private Session' : 'Communal Session';
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${sessionName} (${bookingType === 'private' ? 'Exclusive' : 'Communal'})`,
              description: `60 minute session on ${timeSlot.slot_date} at ${timeSlot.slot_time} for ${guestCount} ${guestCount === 1 ? 'person' : 'people'}${discountLabel ? ` (Discount: ${discountLabel})` : ''}`,
            },
            unit_amount: finalAmount,
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
        bookingType,
        guestCount: guestCount.toString(),
        discountCode: discountCodeRow?.code || partnerCodeRow?.promo_code || "",
        discountCodeId: discountCodeRow?.id || "",
        partnerCodeId: partnerCodeRow?.id || "",
        partnerCompany: partnerCodeRow?.company_name || "",
        originalAmount: originalAmount.toString(),
        discountAmount: discountAmount.toString(),
        finalAmount: finalAmount.toString(),
      }
    });

    // Store booking in database
    const { error: bookingError } = await supabase
      .from("bookings")
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        service_type: "combined",
        session_date: timeSlot.slot_date,
        session_time: timeSlot.slot_time,
        duration_minutes: 60,
        price_amount: originalAmount,
        discount_code_id: discountCodeRow?.id || null,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        stripe_session_id: session.id,
        time_slot_id: timeSlotId,
        special_requests: specialRequests,
        payment_status: "pending",
        booking_type: bookingType,
        guest_count: guestCount,
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});