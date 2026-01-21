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

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log("Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.metadata?.type === "booking") {
        const timeSlotId = session.metadata.timeSlotId;
        const stripeSessionId = session.id;
        
        console.log("Processing booking confirmation for:", { timeSlotId, stripeSessionId });
        
        // Use the existing confirm_booking function
        const { data, error } = await supabase.rpc('confirm_booking', {
          p_time_slot_id: timeSlotId,
          p_stripe_session_id: stripeSessionId
        });
        
        if (error) {
          console.error("Error confirming booking:", error);
          throw error;
        }
        
        console.log("Booking confirmed successfully:", data);
 
        // Promo redemption tracking (if a discount code was used)
        const discountCodeId = session.metadata?.discountCodeId;
        const originalAmount = Number(session.metadata?.originalAmount || 0);
        const discountAmount = Number(session.metadata?.discountAmount || 0);
        const finalAmount = Number(session.metadata?.finalAmount || 0);
        if (discountCodeId && discountCodeId.length > 0 && discountAmount > 0) {
          const { data: bookingRow } = await supabase
            .from('bookings')
            .select('id')
            .eq('stripe_session_id', session.id)
            .maybeSingle();

          if (bookingRow?.id) {
            await supabase
              .from('discount_redemptions')
              .insert({
                discount_code_id: discountCodeId,
                entity_type: 'booking',
                entity_id: bookingRow.id,
                original_amount: originalAmount,
                discount_amount: discountAmount,
                final_amount: finalAmount
              });
          }
        }
      }

      if (session.metadata?.type === "gift_card") {
        // Mark gift card as paid
        await supabase
          .from('gift_cards')
          .update({ payment_status: 'paid' })
          .eq('stripe_session_id', session.id);

        const discountCodeId = session.metadata?.discountCodeId;
        const originalAmount = Number(session.metadata?.originalAmount || 0);
        const discountAmount = Number(session.metadata?.discountAmount || 0);
        const finalAmount = Number(session.metadata?.finalAmount || 0);
        if (discountCodeId && discountCodeId.length > 0 && discountAmount > 0) {
          const { data: gcRow } = await supabase
            .from('gift_cards')
            .select('id')
            .eq('stripe_session_id', session.id)
            .maybeSingle();

          if (gcRow?.id) {
            await supabase
              .from('discount_redemptions')
              .insert({
                discount_code_id: discountCodeId,
                entity_type: 'gift_card',
                entity_id: gcRow.id,
                original_amount: originalAmount,
                discount_amount: discountAmount,
                final_amount: finalAmount
              });
          }
        }
      }

      if (session.mode === 'subscription' && session.metadata?.membershipType && session.metadata?.userId) {
        const userId = session.metadata.userId;
        const membershipType = session.metadata.membershipType;
        const sessionsPerWeek = Number(session.metadata.sessions_per_week || 0);
        const discountPercentage = Number(session.metadata.discount_percentage || 0);
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
        const originalAmount = Number(session.metadata?.originalAmount || 0);
        const discountAmount = Number(session.metadata?.discountAmount || 0);
        const discountCodeId = session.metadata?.discountCodeId || null;

        const { data: membershipRow, error: membershipInsertError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            membership_type: membershipType,
            sessions_per_week: sessionsPerWeek,
            sessions_remaining: sessionsPerWeek,
            status: 'active',
            stripe_subscription_id: subscriptionId,
            discount_percentage: discountPercentage,
            discount_code_id: discountCodeId && discountCodeId.length > 0 ? discountCodeId : null,
            discount_amount: discountAmount,
            price_amount: originalAmount
          })
          .select('id')
          .maybeSingle();

        if (membershipInsertError) {
          console.error('Error inserting membership:', membershipInsertError);
        }

        if (discountCodeId && discountCodeId.length > 0 && discountAmount > 0 && membershipRow?.id) {
          await supabase
            .from('discount_redemptions')
            .insert({
              discount_code_id: discountCodeId,
              entity_type: 'membership',
              entity_id: membershipRow.id,
              original_amount: originalAmount,
              discount_amount: discountAmount,
              final_amount: Math.max(0, originalAmount - discountAmount)
            });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook error:", error);
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