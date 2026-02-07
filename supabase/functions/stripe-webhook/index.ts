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

      // Handle partial credit booking (credit + card payment)
      if (session.metadata?.type === "partial_credit_booking") {
        const timeSlotId = session.metadata.timeSlotId;
        const userId = session.metadata.userId;
        const customerName = session.metadata.customerName;
        const customerEmail = session.metadata.customerEmail;
        const customerPhone = session.metadata.customerPhone || null;
        const bookingType = session.metadata.bookingType as 'communal' | 'private';
        const guestCount = Number(session.metadata.guestCount || 1);
        const specialRequests = session.metadata.specialRequests || null;
        const baseAmount = Number(session.metadata.baseAmount || 0);
        const discountFromCode = Number(session.metadata.discountFromCode || 0);
        const creditAmount = Number(session.metadata.creditAmount || 0);
        const amountToPay = Number(session.metadata.amountToPay || 0);
        const creditsToDeduct = JSON.parse(session.metadata.creditsToDeduct || '[]');
        const discountCodeId = session.metadata.discountCodeId || null;

        console.log("Processing partial credit booking:", { timeSlotId, creditAmount, amountToPay });

        // Get time slot details
        const { data: timeSlot } = await supabase
          .from('time_slots')
          .select('*')
          .eq('id', timeSlotId)
          .single();

        if (!timeSlot) {
          console.error("Time slot not found for partial credit booking");
          throw new Error("Time slot not found");
        }

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
            customer_phone: customerPhone,
            time_slot_id: timeSlotId,
            service_type: 'combined',
            session_date: timeSlot.slot_date,
            session_time: timeSlot.slot_time,
            duration_minutes: 60,
            price_amount: baseAmount,
            discount_code_id: discountCodeId && discountCodeId.length > 0 ? discountCodeId : null,
            discount_amount: discountFromCode + creditAmount,
            final_amount: amountToPay,
            guest_count: guestCount,
            booking_type: bookingType,
            special_requests: specialRequests,
            payment_status: 'paid',
            stripe_session_id: session.id,
          })
          .select()
          .single();

        if (bookingError) {
          console.error("Error creating partial credit booking:", bookingError);
          throw bookingError;
        }

        // Update time slot availability
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

        console.log("Partial credit booking confirmed:", booking?.id);
      }

      if (session.metadata?.type === "gift_card") {
        // Mark gift card as paid
        const { data: gcRow } = await supabase
          .from('gift_cards')
          .update({ payment_status: 'paid' })
          .eq('stripe_session_id', session.id)
          .select('id')
          .maybeSingle();

        // Send gift card email to recipient
        if (gcRow?.id) {
          try {
            const emailResponse = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-gift-card-email`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
                },
                body: JSON.stringify({ giftCardId: gcRow.id })
              }
            );
            if (!emailResponse.ok) {
              console.error("Failed to send gift card email:", await emailResponse.text());
            } else {
              console.log("Gift card email sent successfully");
            }
          } catch (emailError) {
            console.error("Error sending gift card email:", emailError);
          }
        }

        const discountCodeId = session.metadata?.discountCodeId;
        const originalAmount = Number(session.metadata?.originalAmount || 0);
        const discountAmount = Number(session.metadata?.discountAmount || 0);
        const finalAmount = Number(session.metadata?.finalAmount || 0);
        if (discountCodeId && discountCodeId.length > 0 && discountAmount > 0 && gcRow?.id) {
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

      // Handle subscription memberships (auto-renew)
      if (session.mode === 'subscription' && session.metadata?.membershipType && session.metadata?.userId) {
        const userId = session.metadata.userId;
        const membershipType = session.metadata.membershipType;
        // Support both old (sessions_per_week) and new (sessions_per_month) metadata
        const sessionsPerMonth = Number(session.metadata.sessions_per_month || session.metadata.sessions_per_week || 0);
        const discountPercentage = Number(session.metadata.discount_percentage || 0);
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
        const originalAmount = Number(session.metadata?.originalAmount || 0);
        const discountAmount = Number(session.metadata?.discountAmount || 0);
        const discountCodeId = session.metadata?.discountCodeId || null;
        const isAutoRenew = session.metadata?.isAutoRenew === 'true';

        // Get user email and name from Supabase auth
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const customerEmail = userData?.user?.email || session.customer_email || '';
        const customerName = userData?.user?.user_metadata?.full_name || 
                            userData?.user?.user_metadata?.name || 
                            session.customer_details?.name || '';

        // Calculate start and end dates
        const startDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now

        const { data: membershipRow, error: membershipInsertError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            membership_type: membershipType,
            sessions_per_week: sessionsPerMonth, // Column still named sessions_per_week but now stores monthly allocation
            sessions_remaining: membershipType === 'unlimited' ? 999 : sessionsPerMonth,
            status: 'active',
            stripe_subscription_id: subscriptionId,
            discount_percentage: discountPercentage,
            discount_code_id: discountCodeId && discountCodeId.length > 0 ? discountCodeId : null,
            discount_amount: discountAmount,
            price_amount: originalAmount,
            customer_email: customerEmail,
            customer_name: customerName,
            start_date: startDate,
            end_date: endDate,
            is_auto_renew: isAutoRenew
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

      // Handle one-time membership payments (no auto-renew)
      if (session.mode === 'payment' && session.metadata?.type === 'membership_onetime' && session.metadata?.userId) {
        const userId = session.metadata.userId;
        const membershipType = session.metadata.membershipType;
        // Support both old (sessions_per_week) and new (sessions_per_month) metadata
        const sessionsPerMonth = Number(session.metadata.sessions_per_month || session.metadata.sessions_per_week || 0);
        const discountPercentage = Number(session.metadata.discount_percentage || 0);
        const originalAmount = Number(session.metadata?.originalAmount || 0);
        const discountAmount = Number(session.metadata?.discountAmount || 0);
        const discountCodeId = session.metadata?.discountCodeId || null;

        // Get user email and name from Supabase auth
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const customerEmail = userData?.user?.email || session.customer_email || '';
        const customerName = userData?.user?.user_metadata?.full_name || 
                            userData?.user?.user_metadata?.name || 
                            session.customer_details?.name || '';

        // Calculate start and end dates
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data: membershipRow, error: membershipInsertError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            membership_type: membershipType,
            sessions_per_week: sessionsPerMonth, // Column still named sessions_per_week but now stores monthly allocation
            sessions_remaining: membershipType === 'unlimited' ? 999 : sessionsPerMonth,
            status: 'active',
            stripe_subscription_id: null,
            discount_percentage: discountPercentage,
            discount_code_id: discountCodeId && discountCodeId.length > 0 ? discountCodeId : null,
            discount_amount: discountAmount,
            price_amount: originalAmount,
            customer_email: customerEmail,
            customer_name: customerName,
            start_date: startDate,
            end_date: endDate,
            is_auto_renew: false
          })
          .select('id')
          .maybeSingle();

        if (membershipInsertError) {
          console.error('Error inserting one-time membership:', membershipInsertError);
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

      // Handle intro offer purchase (adds tokens to customer_tokens)
      if (session.mode === 'payment' && session.metadata?.type === 'intro_offer') {
        const customerEmail = session.metadata.customerEmail?.toLowerCase().trim();
        const customerName = session.metadata.customerName || '';

        if (customerEmail) {
          // Calculate expiry date (3 months from now)
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 3);

          // Insert tokens for the customer
          const { error: tokenError } = await supabase
            .from('customer_tokens')
            .insert({
              customer_email: customerEmail,
              tokens_remaining: 3,
              expires_at: expiresAt.toISOString(),
              notes: `Introductory Offer - 3 Sessions for £35 (purchased by ${customerName})`
            });

          if (tokenError) {
            console.error('Error inserting intro offer tokens:', tokenError);
          } else {
            console.log('Intro offer tokens created for:', customerEmail);
          }

          // Also add/update customer record if not exists
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', customerEmail)
            .maybeSingle();

          if (!existingCustomer) {
            await supabase.from('customers').insert({
              email: customerEmail,
              full_name: customerName,
              phone: session.metadata.customerPhone || null
            });
          }
        }
      }
    }

    // Handle subscription renewal (invoice paid for recurring subscriptions)
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Only process renewals (not first subscription payment)
      if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
        
        // Find the existing membership with this subscription
        const { data: existingMembership } = await supabase
          .from('memberships')
          .select('*')
          .eq('stripe_subscription_id', subscriptionId)
          .eq('status', 'active')
          .single();

        if (existingMembership) {
          // Extend the membership by 30 days and reset sessions to monthly allocation
          const newEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          await supabase
            .from('memberships')
            .update({
              end_date: newEndDate,
              // Reset sessions to their monthly allocation (stored in sessions_per_week column)
              sessions_remaining: existingMembership.membership_type === 'unlimited' ? 999 : existingMembership.sessions_per_week,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMembership.id);

          console.log('Membership renewed:', existingMembership.id);
        }
      }
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Mark membership as cancelled
      await supabase
        .from('memberships')
        .update({
          status: 'cancelled',
          is_auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);
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