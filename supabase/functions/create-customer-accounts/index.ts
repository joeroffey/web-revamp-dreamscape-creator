import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if requesting user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all customers from the customers table
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, email, full_name, phone');

    if (customersError) {
      throw customersError;
    }

    // Get existing auth users to avoid duplicates
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authUsersError) {
      throw authUsersError;
    }

    const existingEmails = new Set(authUsers.users.map(u => u.email?.toLowerCase()));

    const results = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each customer
    for (const customer of customers || []) {
      const email = customer.email?.toLowerCase();
      
      if (!email) {
        results.skipped++;
        continue;
      }

      // Skip if user already exists
      if (existingEmails.has(email)) {
        results.skipped++;
        continue;
      }

      try {
        // Create auth user with a random password (they'll reset it)
        const tempPassword = crypto.randomUUID() + "Aa1!"; // Ensure it meets password requirements
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: customer.full_name,
            phone: customer.phone,
          },
        });

        if (createError) {
          results.failed++;
          results.errors.push(`${email}: ${createError.message}`);
        } else {
          results.created++;
          existingEmails.add(email); // Prevent duplicate attempts in same batch
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push(`${email}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Created ${results.created} accounts, skipped ${results.skipped} (already exist or no email), ${results.failed} failed`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error creating customer accounts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
