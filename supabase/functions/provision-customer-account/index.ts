import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { serviceClient, requireAdmin } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const SITE_URL = "https://www.revitalisehub.co.uk";

function welcomeEmailHtml(firstName: string, resetUrl: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #CCBBA8;">
    <div style="background: #f5f0ea; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(82,51,31,0.08);">
      <h1 style="text-align: center; color: #52331F; font-weight: 400; font-size: 28px; margin-bottom: 10px; letter-spacing: 2px;">REVITALISE HUB</h1>
      <p style="text-align: center; color: #967B5E; font-size: 13px; margin-bottom: 30px; letter-spacing: 2px;">COLD WATER &amp; CONTRAST THERAPY</p>
      <hr style="border: none; border-top: 1px solid #CCBBA8; margin: 20px 0;">
      <h2 style="color: #52331F; text-align: center; font-weight: 500; margin-bottom: 20px;">Your account is ready</h2>
      <p style="color: #52331F; font-size: 16px; line-height: 1.6; text-align: center;">
        Hi ${firstName}, we've created an account for you at Revitalise Hub. Set your password below to sign in, book sessions and manage your membership.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #52331F; color: #CCBBA8; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-size: 16px; font-weight: 500;">Set Your Password</a>
      </div>
      <p style="color: #967B5E; font-size: 14px; line-height: 1.6; text-align: center;">
        Once your password is set you'll have full access to your account, including your bookings, tokens and membership details.
      </p>
      <div style="background: #CCBBA8; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #52331F; font-size: 14px; margin: 0; text-align: center;">
          <strong>Questions?</strong> Reply to this email or contact us at the hub.
        </p>
      </div>
      <hr style="border: none; border-top: 1px solid #CCBBA8; margin: 30px 0;">
      <p style="text-align: center; font-size: 12px; color: #967B5E;">
        © Revitalise Hub | Lymington<br>
        <a href="${SITE_URL}" style="color: #52331F;">www.revitalisehub.co.uk</a>
      </p>
    </div>
  </body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = serviceClient();

    const authError = await requireAdmin(req, supabase);
    if (authError) return json({ error: authError.message }, authError.status);

    const payload = await req.json().catch(() => null);
    const rawEmail = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return json({ error: "A valid email is required" }, 400);
    }
    const fullName = typeof payload?.full_name === "string" ? payload.full_name.trim() : "";
    const phone = typeof payload?.phone === "string" ? payload.phone.trim() : "";
    const sendEmail = payload?.sendEmail !== false;

    // Look for an existing auth user with this email
    let existingUser: { id: string } | null = null;
    try {
      // @ts-ignore - listUsers supports filtering by email on recent versions
      const { data: byEmail } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      existingUser =
        byEmail?.users?.find((u: any) => u.email?.toLowerCase() === rawEmail) ?? null;
      let page = 2;
      while (!existingUser && byEmail?.users?.length === 200 && page <= 25) {
        const { data: nextPage } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        if (!nextPage?.users?.length) break;
        existingUser = nextPage.users.find((u: any) => u.email?.toLowerCase() === rawEmail) ?? null;
        if (nextPage.users.length < 200) break;
        page++;
      }
    } catch (e) {
      console.error("listUsers failed:", e);
    }

    let created = false;

    if (!existingUser) {
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: rawEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || null,
          phone: phone || null,
        },
      });

      if (createError) {
        const msg = createError.message || "";
        if (/already been registered|already exists/i.test(msg)) {
          console.log(`Account already exists for ${rawEmail}`);
          return json({ created: false, alreadyExisted: true, emailSent: false });
        }
        console.error("createUser failed:", createError);
        return json({ created: false, alreadyExisted: false, emailSent: false, error: msg }, 200);
      }

      created = true;
      console.log(`Created account ${newUser?.user?.id} for ${rawEmail}`);
    }

    if (!created && existingUser && !payload?.forceResend) {
      return json({ created: false, alreadyExisted: true, emailSent: false });
    }

    if (!sendEmail) {
      return json({ created, alreadyExisted: !created, emailSent: false });
    }

    // Generate a password-setup (recovery) link and email it
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: rawEmail,
      options: { redirectTo: `${SITE_URL}/reset-password` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("generateLink failed:", linkError);
      return json({
        created,
        alreadyExisted: !created,
        emailSent: false,
        error: linkError?.message || "Could not generate password link",
      });
    }

    const firstName = (fullName || rawEmail.split("@")[0]).split(" ")[0];
    const { error: emailError } = await resend.emails.send({
      from: "Revitalise Hub <noreply@revitalisehub.co.uk>",
      to: [rawEmail],
      subject: "Your Revitalise Hub account - Set Your Password",
      html: welcomeEmailHtml(firstName, linkData.properties.action_link),
    });

    if (emailError) {
      console.error("Resend failed:", emailError);
      return json({
        created,
        alreadyExisted: !created,
        emailSent: false,
        error: (emailError as any)?.message || "Email send failed",
      });
    }

    return json({ created, alreadyExisted: !created, emailSent: true });
  } catch (error: any) {
    console.error("provision-customer-account error:", error);
    return json({ error: error?.message || "Unexpected error" }, 500);
  }
});
