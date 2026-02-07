import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Parse request body for optional test mode
    const body = await req.json().catch(() => ({}));
    const testMode = body.testMode || false;
    const testEmail = body.testEmail;

    // Fetch all users
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersError) {
      throw usersError;
    }

    // Get profiles for names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name');

    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

    let usersToProcess = authUsers.users;
    
    // In test mode, only send to the test email
    if (testMode && testEmail) {
      usersToProcess = authUsers.users.filter(u => u.email === testEmail);
      if (usersToProcess.length === 0) {
        return new Response(
          JSON.stringify({ error: `Test email ${testEmail} not found in users` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const results = {
      total: usersToProcess.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const user of usersToProcess) {
      if (!user.email) continue;

      try {
        // Generate password reset link
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: user.email,
          options: {
            redirectTo: 'https://www.revitalisehub.co.uk/reset-password',
          },
        });

        if (linkError) {
          results.failed++;
          results.errors.push(`${user.email}: ${linkError.message}`);
          continue;
        }

        const resetUrl = linkData.properties.action_link;
        const firstName = profileMap.get(user.id)?.split(' ')[0] || 'there';

        // Send email via Resend
        const { error: emailError } = await resend.emails.send({
          from: "Revitalise Hub <noreply@revitalisehub.co.uk>",
          to: [user.email],
          subject: "Welcome to Our New Website - Set Your Password",
          html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #CCBBA8;">
    <div style="background: #f5f0ea; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(82,51,31,0.08);">
      
      <h1 style="text-align: center; color: #52331F; font-weight: 400; font-size: 28px; margin-bottom: 10px; letter-spacing: 2px;">REVITALISE HUB</h1>
      
      <p style="text-align: center; color: #967B5E; font-size: 13px; margin-bottom: 30px; letter-spacing: 2px;">COLD WATER & CONTRAST THERAPY</p>
      
      <hr style="border: none; border-top: 1px solid #CCBBA8; margin: 20px 0;">
      
      <h2 style="color: #52331F; text-align: center; font-weight: 500; margin-bottom: 20px;">Welcome to Our New Website!</h2>
      
      <p style="color: #52331F; font-size: 16px; line-height: 1.6; text-align: center;">
        Hi ${firstName}, we've launched our new online booking platform! To get started, please set your password by clicking the button below.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #52331F; color: #CCBBA8; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-size: 16px; font-weight: 500;">Set Your Password</a>
      </div>
      
      <h3 style="color: #52331F; font-weight: 500; margin-top: 30px;">Important Information Regarding Memberships:</h3>
      
      <ul style="color: #52331F; font-size: 15px; line-height: 1.8; padding-left: 20px;">
        <li><strong>Standing Orders:</strong> If you currently pay via standing order, no action is needed – your payments will continue as normal.</li>
        <li><strong>Monthly Subscriptions:</strong> For security reasons, we're unable to transfer existing card payment details. You'll need to re-sign up for your membership through our new website.</li>
        <li><strong>Unused Sessions:</strong> Any sessions remaining from your previous membership period will be added to your account as tokens, valid for 6 months.</li>
      </ul>
      
      <div style="background: #CCBBA8; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #52331F; font-size: 14px; margin: 0; text-align: center;">
          <strong>Questions?</strong> Reply to this email or contact us at the hub.
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #CCBBA8; margin: 30px 0;">
      
      <p style="text-align: center; font-size: 12px; color: #967B5E;">
        © Revitalise Hub | Lymington<br>
        <a href="https://www.revitalisehub.co.uk" style="color: #52331F;">www.revitalisehub.co.uk</a>
      </p>
    </div>
  </body>
</html>
          `,
        });

        if (emailError) {
          results.failed++;
          results.errors.push(`${user.email}: Email send failed`);
        } else {
          results.sent++;
          console.log(`Sent reset email to: ${user.email}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err: any) {
        results.failed++;
        results.errors.push(`${user.email}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify(results),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in bulk password reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
