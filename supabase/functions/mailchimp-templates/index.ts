import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, json, getMailchimpConfig, mailchimpRequest, getListDefaults } from "../_shared/mailchimp.ts";
import { requireAdmin, serviceClient } from "../_shared/adminAuth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = serviceClient();
    const cronSecret = Deno.env.get("CONDITIONAL_EMAILS_CRON_SECRET");
    const isInternal = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
    if (!isInternal) {
      const authError = await requireAdmin(req, supabase);
      if (authError) return json({ error: authError.message }, authError.status);
    }

    const cfg = getMailchimpConfig();

    const [userTemplates, defaults] = await Promise.all([
      mailchimpRequest(cfg, `/templates?count=200&type=user&sort_field=date_created&sort_dir=DESC`),
      getListDefaults(cfg).catch(() => ({ fromName: "", replyTo: "" })),
    ]);

    const templates = (userTemplates?.templates || []).map((t: any) => ({
      id: String(t.id),
      name: t.name,
      dateEdited: t.date_edited || t.date_created,
      thumbnail: t.thumbnail,
      previewUrl: `https://${cfg.serverPrefix}.admin.mailchimp.com/templates/edit?id=${t.id}`,
    }));

    return json({ templates, defaults });
  } catch (error) {
    console.error("mailchimp-templates error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
