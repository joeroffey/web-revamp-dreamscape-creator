import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();
    
    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'Booking ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found', details: bookingError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already paid, return success
    if (booking.payment_status === 'paid') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Booking is already marked as paid',
          status: 'already_paid'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there's a Stripe session ID
    if (!booking.stripe_session_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No Stripe session ID found for this booking. This booking may have been created manually.',
          status: 'no_stripe_session'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the Stripe session
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
    } catch (stripeError: any) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Could not retrieve Stripe session: ${stripeError.message}`,
          status: 'stripe_error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Stripe session status for booking ${bookingId}:`, session.payment_status);

    // Check the payment status
    if (session.payment_status === 'paid') {
      // Payment was successful - update the booking
      // Call the confirm_booking function to properly update slot availability
      const { data: confirmResult, error: confirmError } = await supabase.rpc('confirm_booking', {
        p_stripe_session_id: booking.stripe_session_id,
        p_time_slot_id: booking.time_slot_id
      });

      if (confirmError) {
        console.error('Error confirming booking:', confirmError);
        // Fall back to direct update if RPC fails
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (updateError) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `Stripe shows payment successful but failed to update booking: ${updateError.message}`,
              status: 'update_failed'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Log the recovery action
      await supabase.from('audit_logs').insert({
        action: 'MANUAL_PAYMENT_VERIFICATION',
        table_name: 'bookings',
        record_id: bookingId,
        new_values: { 
          payment_status: 'paid',
          stripe_session_status: session.payment_status,
          verified_at: new Date().toISOString()
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment verified! Booking has been marked as paid.',
          status: 'payment_confirmed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (session.payment_status === 'unpaid') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Stripe shows this payment as unpaid. The customer may have abandoned checkout.',
          status: 'unpaid',
          stripeStatus: session.payment_status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Stripe payment status is: ${session.payment_status}`,
          status: 'other',
          stripeStatus: session.payment_status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error verifying booking payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
