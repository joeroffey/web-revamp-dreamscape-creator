import { crypto as stdCrypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export interface MailchimpConfig {
  apiKey: string;
  listId: string;
  serverPrefix: string;
}

export function getMailchimpConfig(): MailchimpConfig {
  const apiKey = Deno.env.get("MAILCHIMP_API_KEY");
  const listId = Deno.env.get("MAILCHIMP_LIST_ID");
  const serverPrefix = Deno.env.get("MAILCHIMP_SERVER_PREFIX");
  if (!apiKey || !listId || !serverPrefix) {
    throw new Error("Mailchimp is not configured (missing API key, list id or server prefix)");
  }
  return { apiKey, listId, serverPrefix };
}

export async function mailchimpRequest(
  cfg: MailchimpConfig,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<any> {
  const url = `https://${cfg.serverPrefix}.api.mailchimp.com/3.0${path}`;
  const res = await fetch(url, {
    method: init.method || "GET",
    headers: {
      Authorization: `apikey ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Mailchimp ${init.method || "GET"} ${path} failed [${res.status}]: ${text}`);
    throw new Error(`Mailchimp API error ${res.status}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : {};
}

export async function subscriberHash(email: string): Promise<string> {
  const data = new TextEncoder().encode(email.toLowerCase().trim());
  const buf = await stdCrypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function splitName(fullName?: string | null) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
}

/**
 * Make sure the customer exists in the audience. Returns the member status.
 * Never re-subscribes someone who unsubscribed or cleaned.
 */
export async function ensureMember(
  cfg: MailchimpConfig,
  email: string,
  fullName?: string | null,
): Promise<{ status: string }> {
  const hash = await subscriberHash(email);
  const { firstName, lastName } = splitName(fullName);
  const member = await mailchimpRequest(cfg, `/lists/${cfg.listId}/members/${hash}`, {
    method: "PUT",
    body: {
      email_address: email.toLowerCase().trim(),
      status_if_new: "subscribed",
      merge_fields: { FNAME: firstName, LNAME: lastName },
    },
  });
  return { status: member.status };
}

export async function applyTag(cfg: MailchimpConfig, email: string, tag: string) {
  const hash = await subscriberHash(email);
  await mailchimpRequest(cfg, `/lists/${cfg.listId}/members/${hash}/tags`, {
    method: "POST",
    body: { tags: [{ name: tag, status: "active" }] },
  });
}

export async function getListDefaults(cfg: MailchimpConfig) {
  const list = await mailchimpRequest(cfg, `/lists/${cfg.listId}`);
  return {
    fromName: list?.campaign_defaults?.from_name || "Revitalise Hub",
    replyTo: list?.campaign_defaults?.from_email as string | undefined,
  };
}

/**
 * Sends a Mailchimp template to a single recipient by creating a
 * one-recipient campaign restricted by an email-address segment.
 * Returns the campaign id.
 */
export async function sendTemplateToOne(
  cfg: MailchimpConfig,
  opts: {
    email: string;
    templateId: string | number;
    subject: string;
    fromName?: string | null;
    replyTo?: string | null;
    title: string;
  },
): Promise<string> {
  const defaults = await getListDefaults(cfg);
  const fromName = opts.fromName || defaults.fromName;
  const replyTo = opts.replyTo || defaults.replyTo;
  if (!replyTo) {
    throw new Error("No reply-to address available (set one on the Mailchimp audience or the rule)");
  }

  const campaign = await mailchimpRequest(cfg, `/campaigns`, {
    method: "POST",
    body: {
      type: "regular",
      recipients: {
        list_id: cfg.listId,
        segment_opts: {
          match: "any",
          conditions: [
            {
              condition_type: "EmailAddress",
              field: "EMAIL",
              op: "is",
              value: opts.email.toLowerCase().trim(),
            },
          ],
        },
      },
      settings: {
        subject_line: opts.subject,
        title: opts.title.slice(0, 99),
        from_name: fromName,
        reply_to: replyTo,
        template_id: Number(opts.templateId),
        auto_footer: false,
      },
    },
  });

  await mailchimpRequest(cfg, `/campaigns/${campaign.id}/actions/send`, { method: "POST" });
  return campaign.id as string;
}
