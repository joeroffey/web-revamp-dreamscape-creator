import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await supabaseClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { currentEmail, newEmail } = await req.json();

    if (!currentEmail || !newEmail) {
      return new Response(
        JSON.stringify({ error: "Both currentEmail and newEmail are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedNewEmail = newEmail.trim().toLowerCase();
    const trimmedCurrentEmail = currentEmail.trim().toLowerCase();

    if (trimmedNewEmail === trimmedCurrentEmail) {
      return new Response(
        JSON.stringify({ error: "New email is the same as current email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the auth user by current email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to look up user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUser = users.find(
      (u) => u.email?.toLowerCase() === trimmedCurrentEmail
    );

    // Check if new email already belongs to a different auth user
    const conflictUser = users.find(
      (u) => u.email?.toLowerCase() === trimmedNewEmail
    );
    if (conflictUser && (!authUser || conflictUser.id !== authUser.id)) {
      return new Response(
        JSON.stringify({ error: "This email is already associated with another account." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authUser) {
      // No auth account — just update the customers table
      const { error: custError } = await supabaseAdmin
        .from("customers")
        .update({ email: trimmedNewEmail })
        .eq("email", trimmedCurrentEmail);

      if (custError) {
        console.error("Error updating customer:", custError);
        return new Response(
          JSON.stringify({ error: "Failed to update customer record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin.from("bookings").update({ customer_email: trimmedNewEmail }).eq("customer_email", trimmedCurrentEmail);
      await supabaseAdmin.from("memberships").update({ customer_email: trimmedNewEmail }).eq("customer_email", trimmedCurrentEmail);
      await supabaseAdmin.from("customer_tokens").update({ customer_email: trimmedNewEmail }).eq("customer_email", trimmedCurrentEmail);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Customer email updated. No auth account was found.",
          hasAuthAccount: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the auth user's email directly (admin override, no confirmation needed)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { email: trimmedNewEmail, email_confirm: true }
    );

    if (updateError) {
      console.error("Error updating auth email:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message || "Failed to update auth email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only update DB tables after auth update succeeded
    await supabaseAdmin.from("customers").update({ email: trimmedNewEmail }).eq("email", trimmedCurrentEmail);
    await supabaseAdmin.from("bookings").update({ customer_email: trimmedNewEmail }).eq("customer_email", trimmedCurrentEmail);
    await supabaseAdmin.from("memberships").update({ customer_email: trimmedNewEmail }).eq("customer_email", trimmedCurrentEmail);
    await supabaseAdmin.from("customer_tokens").update({ customer_email: trimmedNewEmail }).eq("customer_email", trimmedCurrentEmail);
    await supabaseAdmin.from("customer_credits").update({ customer_email: trimmedNewEmail }).eq("customer_email", trimmedCurrentEmail);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email updated successfully.",
        hasAuthAccount: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
