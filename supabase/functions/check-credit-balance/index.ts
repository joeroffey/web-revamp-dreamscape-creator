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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the authorization header to identify the user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ totalCredits: 0, credits: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Verify the user's JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ totalCredits: 0, credits: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get all non-expired credits for this user
    const { data: credits, error: creditsError } = await supabase
      .from('customer_credits')
      .select('*')
      .eq('user_id', user.id)
      .gt('credit_balance', 0)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true }); // Use oldest credits first

    if (creditsError) {
      console.error("Error fetching credits:", creditsError);
      throw new Error("Failed to fetch credit balance");
    }

    const totalCredits = (credits || []).reduce((sum, c) => sum + c.credit_balance, 0);

    return new Response(
      JSON.stringify({
        totalCredits,
        totalCreditsInPounds: (totalCredits / 100).toFixed(2),
        credits: credits || []
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error checking credit balance:", error);
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
