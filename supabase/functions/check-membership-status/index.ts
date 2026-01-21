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
    const { userId, email } = await req.json();

    if (!userId && !email) {
      throw new Error("Either userId or email is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Build query based on what we have
    let query = supabase
      .from('memberships')
      .select('*')
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0]);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      query = query.eq('customer_email', email);
    }

    const { data: memberships, error } = await query.order('created_at', { ascending: false }).limit(1);

    if (error) {
      throw error;
    }

    if (!memberships || memberships.length === 0) {
      return new Response(
        JSON.stringify({ 
          hasMembership: false,
          membership: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const membership = memberships[0];
    const isUnlimited = membership.membership_type === 'unlimited' || membership.sessions_per_week === 999;
    const sessionsRemaining = isUnlimited ? 999 : membership.sessions_remaining;
    const canBook = isUnlimited || sessionsRemaining > 0;

    return new Response(
      JSON.stringify({
        hasMembership: true,
        canBook,
        membership: {
          id: membership.id,
          type: membership.membership_type,
          sessionsPerWeek: membership.sessions_per_week,
          sessionsRemaining: sessionsRemaining,
          isUnlimited,
          startDate: membership.start_date,
          endDate: membership.end_date,
          lastReset: membership.last_session_reset,
          customerEmail: membership.customer_email,
          customerName: membership.customer_name
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error checking membership status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
