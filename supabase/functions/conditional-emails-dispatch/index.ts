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

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 3;

function inQuietHours(startHour: number, endHour: number, now = new Date()): boolean {
  const h = now.getUTCHours();
  if (startHour === endHour) return false;
  // Window may wrap midnight (e.g. 21 -> 8)
  return startHour < endHour ? h >= startHour && h < endHour : h >= startHour || h < endHour;
}

function nextQuietHoursEnd(endHour: number, now = new Date()): string {
  const next = new Date(now);
  next.setUTCMinutes(5, 0, 0);
  next.setUTCHours(endHour);
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = serviceClient();
    const authError = await requireAdmin(req, supabase);
    if (authError) return json({ error: authError.message }, authError.status);

    const { data: settings } = await supabase
      .from("conditional_email_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settings?.kill_switch) {
      return json({ sent: 0, failed: 0, deferred: 0, note: "kill switch is on" });
    }

    if (settings?.global_daily_cap) {
      const since = new Date(Date.now() - 86400000).toISOString();
      const { count } = await supabase
        .from("conditional_email_sends")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("sent_at", since);
      if ((count || 0) >= settings.global_daily_cap) {
        return json({ sent: 0, failed: 0, deferred: 0, note: "global daily cap reached" });
      }
    }

    const { data: due, error: dueError } = await supabase
      .from("conditional_email_sends")
      .select("*, rule:conditional_email_rules(*)")
      .eq("status", "queued")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(BATCH_SIZE);

    if (dueError) throw dueError;
    if (!due || due.length === 0) return json({ sent: 0, failed: 0, deferred: 0 });

    const cfg = getMailchimpConfig();
    let sent = 0;
    let failed = 0;
    let deferred = 0;
    let skipped = 0;

    for (const item of due as any[]) {
      const rule = item.rule;

      if (!rule || !rule.is_active) {
        await supabase
          .from("conditional_email_sends")
          .update({ status: "cancelled", error: "Rule is inactive or missing" })
          .eq("id", item.id);
        skipped++;
        continue;
      }

      if (
        rule.quiet_hours_enabled &&
        settings &&
        inQuietHours(settings.quiet_hours_start ?? 21, settings.quiet_hours_end ?? 8)
      ) {
        await supabase
          .from("conditional_email_sends")
          .update({ scheduled_for: nextQuietHoursEnd(settings.quiet_hours_end ?? 8) })
          .eq("id", item.id);
        deferred++;
        continue;
      }

      // Claim the row so parallel runs cannot double-send.
      const { data: claimed } = await supabase
        .from("conditional_email_sends")
        .update({ status: "sending", attempts: (item.attempts || 0) + 1 })
        .eq("id", item.id)
        .eq("status", "queued")
        .select("id")
        .maybeSingle();
      if (!claimed) {
        skipped++;
        continue;
      }

      try {
        const member = await ensureMember(cfg, item.customer_email, item.customer_name);
        if (member.status !== "subscribed") {
          await supabase
            .from("conditional_email_sends")
            .update({ status: "skipped", error: `Mailchimp status is "${member.status}"` })
            .eq("id", item.id);
          skipped++;
          continue;
        }

        if (rule.mailchimp_tag) {
          await applyTag(cfg, item.customer_email, rule.mailchimp_tag);
        }

        const campaignId = await sendTemplateToOne(cfg, {
          email: item.customer_email,
          templateId: rule.mailchimp_template_id,
          subject: rule.subject,
          fromName: rule.from_name,
          replyTo: rule.reply_to,
          title: `${rule.name} — ${item.customer_email}`,
        });

        await supabase
          .from("conditional_email_sends")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            mailchimp_campaign_id: campaignId,
            error: null,
          })
          .eq("id", item.id);
        sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`Conditional email send failed (${item.id}):`, message);
        const attempts = (item.attempts || 0) + 1;
        await supabase
          .from("conditional_email_sends")
          .update({
            status: attempts >= MAX_ATTEMPTS ? "failed" : "queued",
            scheduled_for:
              attempts >= MAX_ATTEMPTS
                ? item.scheduled_for
                : new Date(Date.now() + attempts * 15 * 60000).toISOString(),
            error: message.slice(0, 1000),
          })
          .eq("id", item.id);
        failed++;
      }
    }

    console.log(`conditional-emails-dispatch: sent=${sent} failed=${failed} deferred=${deferred} skipped=${skipped}`);
    return json({ sent, failed, deferred, skipped, processed: due.length });
  } catch (error) {
    console.error("conditional-emails-dispatch error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
