import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { serviceClient, requireAdmin } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
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

    const cronSecret = Deno.env.get("CONDITIONAL_EMAILS_CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");
    let internal = !!cronSecret && providedSecret === cronSecret;

    // One-off maintenance token stored in system_settings (removed after the backfill run)
    if (!internal && providedSecret) {
      const { data: tokenRow } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "backfill_accounts_token")
        .maybeSingle();
      const stored = (tokenRow?.setting_value as any)?.token;
      if (stored && stored === providedSecret) internal = true;
    }

    if (!internal) {
      const authError = await requireAdmin(req, supabase);
      if (authError) return json({ error: authError.message }, authError.status);
    }


    const payload = await req.json().catch(() => ({}));
    const dryRun = payload?.dryRun === true;
    const limit = Number.isFinite(payload?.limit) ? Math.min(Number(payload.limit), 200) : 200;

    // Build set of existing auth emails
    const existing = new Set<string>();
    for (let page = 1; page <= 25; page++) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      const users = data?.users ?? [];
      users.forEach((u: any) => u.email && existing.add(u.email.toLowerCase()));
      if (users.length < 200) break;
    }

    // Fetch all customers (paginated past the 1000-row default)
    const customers: any[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error: custError } = await supabase
        .from("customers")
        .select("email, full_name, phone")
        .order("created_at", { ascending: true })
        .range(from, from + 999);
      if (custError) return json({ error: custError.message }, 500);
      customers.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid: any[] = [];
    const missing: any[] = [];
    for (const c of customers) {
      const email = String(c.email ?? "").trim();
      if (!email || existing.has(email.toLowerCase())) continue;
      if (!emailRe.test(email)) {
        invalid.push({ email, name: c.full_name });
        continue;
      }
      if (missing.length < limit) missing.push(c);
    }

    if (dryRun) {
      return json({
        dryRun: true,
        totalCustomers: customers.length,
        missingCount: missing.length,
        missing,
        invalidCount: invalid.length,
        invalid,
      });
    }


    const emailed: any[] = [];
    const failed: any[] = [];

    for (const c of missing) {
      const email = String(c.email).trim().toLowerCase();
      const fullName = (c.full_name || "").trim();
      try {
        const { error: createError } = await supabase.auth.admin.createUser({
          email,
          password: crypto.randomUUID() + "Aa1!",
          email_confirm: true,
          user_metadata: { full_name: fullName || null, phone: c.phone || null },
        });
        if (createError && !/already been registered|already exists/i.test(createError.message || "")) {
          failed.push({ email, name: fullName, reason: createError.message });
          continue;
        }

        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: `${SITE_URL}/reset-password` },
        });
        if (linkError || !linkData?.properties?.action_link) {
          failed.push({ email, name: fullName, reason: linkError?.message || "link generation failed" });
          continue;
        }

        const firstName = (fullName || email.split("@")[0]).split(" ")[0];
        const { error: emailError } = await resend.emails.send({
          from: "Revitalise Hub <noreply@revitalisehub.co.uk>",
          to: [email],
          subject: "Your Revitalise Hub account - Set Your Password",
          html: welcomeEmailHtml(firstName, linkData.properties.action_link),
        });
        if (emailError) {
          failed.push({ email, name: fullName, reason: (emailError as any)?.message || "email send failed" });
          continue;
        }

        emailed.push({ email, name: fullName });
        // gentle pacing for Resend rate limits
        await new Promise((r) => setTimeout(r, 600));
      } catch (e: any) {
        failed.push({ email, name: fullName, reason: e?.message || "unexpected error" });
      }
    }

    return json({
      totalCustomers: customers?.length ?? 0,
      processed: missing.length,
      emailedCount: emailed.length,
      emailed,
      failedCount: failed.length,
      failed,
    });
  } catch (error: any) {
    console.error("backfill-customer-accounts error:", error);
    return json({ error: error?.message || "Unexpected error" }, 500);
  }
});
