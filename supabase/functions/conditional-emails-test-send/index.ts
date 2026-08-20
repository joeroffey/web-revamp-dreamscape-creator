import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  applyTag,
  corsHeaders,
  ensureMember,
  getMailchimpConfig,
  json,
  sendTemplateToOne,
} from "../_shared/mailchimp.ts";
import { requireAdmin, serviceClient } from "../_shared/adminAuth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = serviceClient();
    const authError = await requireAdmin(req, supabase);
    if (authError) return json({ error: authError.message }, authError.status);

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").toLowerCase().trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "A valid email address is required" }, 400);
    }

    let templateId = body.template_id;
    let subject = body.subject;
    let fromName = body.from_name ?? null;
    let replyTo = body.reply_to ?? null;
    let tag: string | null = null;
    let ruleName = "Test send";

    if (body.rule_id) {
      const { data: rule, error } = await supabase
        .from("conditional_email_rules")
        .select("*")
        .eq("id", body.rule_id)
        .maybeSingle();
      if (error) throw error;
      if (!rule) return json({ error: "Rule not found" }, 404);
      templateId = rule.mailchimp_template_id;
      subject = subject || rule.subject;
      fromName = fromName ?? rule.from_name;
      replyTo = replyTo ?? rule.reply_to;
      tag = body.apply_tag ? rule.mailchimp_tag : null;
      ruleName = rule.name;
    }

    if (!templateId) return json({ error: "A Mailchimp template is required" }, 400);
    if (!subject) return json({ error: "A subject line is required" }, 400);

    const cfg = getMailchimpConfig();

    const member = await ensureMember(cfg, email, body.name ?? null);
    if (member.status !== "subscribed") {
      return json(
        {
          error: `That address is "${member.status}" in Mailchimp, so it cannot receive campaigns.`,
        },
        400,
      );
    }

    if (tag) await applyTag(cfg, email, tag);

    const campaignId = await sendTemplateToOne(cfg, {
      email,
      templateId,
      subject: `[TEST] ${subject}`,
      fromName,
      replyTo,
      title: `TEST — ${ruleName} — ${email}`,
    });

    if (body.rule_id) {
      await supabase.from("conditional_email_sends").insert({
        rule_id: body.rule_id,
        customer_email: email,
        customer_name: body.name ?? null,
        occurrence_key: `${email}:test_${Date.now()}`,
        status: "sent",
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        mailchimp_campaign_id: campaignId,
        attempts: 1,
        payload: { test: true },
      });
    }

    return json({ success: true, campaign_id: campaignId, email });
  } catch (error) {
    console.error("conditional-emails-test-send error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
