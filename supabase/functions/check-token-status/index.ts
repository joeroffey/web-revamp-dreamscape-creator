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
    const { email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all valid tokens for this email (not expired, with remaining tokens)
    const now = new Date().toISOString();
    
    const { data: tokens, error } = await supabase
      .from('customer_tokens')
      .select('*')
      .eq('customer_email', email.trim().toLowerCase())
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

    return new Response(
      JSON.stringify({
        hasTokens: true,
        tokensRemaining: totalTokens,
        isIntroOffer,
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
