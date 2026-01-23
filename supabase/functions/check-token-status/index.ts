import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { email, checkDate } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();
    
    // Get all valid tokens for this email (not expired, with remaining tokens)
    const { data: tokens, error } = await supabase
      .from('customer_tokens')
      .select('*')
      .eq('customer_email', normalizedEmail)
      .gt('tokens_remaining', 0)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('expires_at', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          hasTokens: false,
          tokensRemaining: 0,
          canBook: false,
          tokenDetails: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Calculate total tokens available
    const totalTokens = tokens.reduce((sum, t) => sum + t.tokens_remaining, 0);
    
    // Get the first token record (with earliest expiry) for display purposes
    const primaryToken = tokens[0];
    
    // Check if it's an introductory offer
    const isIntroOffer = primaryToken.notes?.includes('Introductory Offer');

    // Check if user already used a token for the specified date
    // A token booking is one where final_amount is 0 or null (free via token) AND no membership
    let hasUsedTokenForDate = false;
    let tokenBookingForDate = null;
    
    if (checkDate) {
      const { data: existingTokenBookings } = await supabase
        .from('bookings')
        .select('id, session_date, session_time, booking_type, final_amount, customer_email')
        .eq('customer_email', normalizedEmail)
        .eq('session_date', checkDate)
        .eq('payment_status', 'paid')
        .or('final_amount.eq.0,final_amount.is.null');
      
      // Filter to only token bookings (not membership - membership has user_id set)
      if (existingTokenBookings && existingTokenBookings.length > 0) {
        // Check if any of these bookings are token bookings (no user_id means it's likely a token booking)
        const { data: membershipBookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('customer_email', normalizedEmail)
          .eq('session_date', checkDate)
          .eq('payment_status', 'paid')
          .or('final_amount.eq.0,final_amount.is.null')
          .not('user_id', 'is', null);
        
        const membershipBookingIds = new Set(membershipBookings?.map(b => b.id) || []);
        const tokenOnlyBookings = existingTokenBookings.filter(b => !membershipBookingIds.has(b.id));
        
        if (tokenOnlyBookings.length > 0) {
          hasUsedTokenForDate = true;
          tokenBookingForDate = tokenOnlyBookings[0];
        }
      }
    }

    // Can use token if: has tokens AND hasn't used token for this date
    const canBook = totalTokens > 0 && !hasUsedTokenForDate;

    return new Response(
      JSON.stringify({
        hasTokens: true,
        tokensRemaining: totalTokens,
        isIntroOffer,
        canBook,
        hasUsedTokenForDate,
        tokenBookingForDate,
        tokenDetails: {
          id: primaryToken.id,
          expiresAt: primaryToken.expires_at,
          notes: primaryToken.notes,
          tokensInFirstBatch: primaryToken.tokens_remaining
        },
        allTokens: tokens.map(t => ({
          id: t.id,
          tokensRemaining: t.tokens_remaining,
          expiresAt: t.expires_at,
          notes: t.notes
        }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error checking token status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
