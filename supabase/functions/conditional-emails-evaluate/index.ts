import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/mailchimp.ts";
import { requireAdmin, serviceClient } from "../_shared/adminAuth.ts";

interface Rule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  filters: Record<string, any>;
  delay_minutes: number;
  repeat_policy: string;
  repeat_window_days: number | null;
  is_active: boolean;
  daily_cap: number | null;
}

interface Candidate {
  email: string;
  name?: string | null;
  userId?: string | null;
  occurrenceKey: string;
  payload?: Record<string, any>;
}

interface Facts {
  email: string;
  name: string | null;
  paidSessions: number;
  purchases: number;
  lifetimeSpend: number; // pounds
  isMember: boolean;
  tokensRemaining: number;
  creditBalance: number;
  tags: string[];
}

const num = (v: any, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
const lower = (s?: string | null) => (s || "").toLowerCase().trim();
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

async function loadFacts(supabase: SupabaseClient, email: string): Promise<Facts> {
  const e = lower(email);

  const [bookings, memberships, tokens, credits, customer] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, final_amount, price_amount, session_date, payment_status")
      .eq("customer_email", e)
      .eq("payment_status", "paid"),
    supabase
      .from("memberships")
      .select("id, status, price_amount, end_date")
      .eq("customer_email", e),
    supabase.from("customer_tokens").select("tokens_remaining, expires_at").eq("customer_email", e),
    supabase.from("customer_credits").select("credit_balance").eq("customer_email", e),
    supabase.from("customers").select("full_name, tags").eq("email", e).maybeSingle(),
  ]);

  const paid = bookings.data || [];
  const bookingSpend = paid.reduce(
    (sum, b: any) => sum + num(b.final_amount ?? b.price_amount) / 100,
    0,
  );
  const membershipSpend = (memberships.data || []).reduce(
    (sum, m: any) => sum + num(m.price_amount) / 100,
    0,
  );

  return {
    email: e,
    name: (customer.data as any)?.full_name ?? null,
    paidSessions: paid.length,
    purchases: paid.length + (memberships.data || []).length,
    lifetimeSpend: bookingSpend + membershipSpend,
    isMember: (memberships.data || []).some((m: any) => m.status === "active"),
    tokensRemaining: (tokens.data || []).reduce((s, t: any) => s + num(t.tokens_remaining), 0),
    creditBalance: (credits.data || []).reduce((s, c: any) => s + num(c.credit_balance), 0),
    tags: ((customer.data as any)?.tags || []) as string[],
  };
}

function passesFilters(rule: Rule, facts: Facts): boolean {
  const f = rule.filters || {};

  if (f.membership === "member" && !facts.isMember) return false;
  if (f.membership === "non_member" && facts.isMember) return false;
  if (f.has_tokens === true && facts.tokensRemaining <= 0) return false;
  if (f.has_tokens === false && facts.tokensRemaining > 0) return false;
  if (f.min_lifetime_spend && facts.lifetimeSpend < num(f.min_lifetime_spend)) return false;
  if (f.tag && !facts.tags.map(lower).includes(lower(f.tag))) return false;
  if (f.customer_type === "first_time" && facts.paidSessions > 1) return false;
  if (f.customer_type === "returning" && facts.paidSessions <= 1) return false;

  return true;
}

/** Event types -> the trigger ids they can satisfy. */
const EVENT_TRIGGERS: Record<string, string[]> = {
  booking_paid: [
    "booking_created",
    "first_booking",
    "nth_session",
    "first_private_booking",
    "first_communal_booking",
    "booking_with_guests",
    "nth_purchase",
    "lifetime_spend_over",
    "single_purchase_over",
  ],
  booking_cancelled: ["booking_cancelled"],
  booking_refunded: ["booking_refunded"],
  booking_rescheduled: ["booking_rescheduled"],
  membership_started: ["membership_started", "nth_purchase", "lifetime_spend_over", "single_purchase_over"],
  membership_renewed: ["membership_renewed"],
  membership_cancelled: ["membership_cancelled"],
  membership_plan_changed: ["membership_plan_changed"],
  intro_offer_purchased: ["intro_offer_purchased", "nth_purchase"],
  gift_card_purchased: ["gift_card_purchased", "single_purchase_over"],
  gift_card_redeemed: ["gift_card_redeemed"],
  account_created: ["account_created"],
  contact_message_resolved: ["contact_message_resolved"],
};

/**
 * Returns an occurrence key when the rule matches this event, otherwise null.
 * `event.data` carries whatever the caller knows (booking id, amount, guest count...).
 */
function matchEvent(rule: Rule, event: any, facts: Facts): string | null {
  const cfg = rule.trigger_config || {};
  const data = event.data || {};
  const ref = data.booking_id || data.membership_id || data.gift_card_id || data.reference || event.type;

  switch (rule.trigger_type) {
    case "booking_created":
    case "booking_cancelled":
    case "booking_refunded":
    case "booking_rescheduled":
    case "membership_started":
    case "membership_cancelled":
    case "membership_plan_changed":
    case "intro_offer_purchased":
    case "gift_card_purchased":
    case "gift_card_redeemed":
    case "account_created":
    case "contact_message_resolved":
      return `${facts.email}:${ref}`;

    case "first_booking":
      return facts.paidSessions <= 1 ? `${facts.email}:first_booking` : null;

    case "nth_session":
      return facts.paidSessions === num(cfg.count, 3)
        ? `${facts.email}:session_${num(cfg.count, 3)}`
        : null;

    case "first_private_booking":
      return data.booking_type === "private" ? `${facts.email}:first_private` : null;

    case "first_communal_booking":
      return data.booking_type === "communal" ? `${facts.email}:first_communal` : null;

    case "booking_with_guests":
      return num(data.guest_count, 1) >= num(cfg.min_guests, 2)
        ? `${facts.email}:${ref}:guests`
        : null;

    case "membership_renewed": {
      const nth = num(cfg.nth, 0);
      if (nth > 0) {
        return num(data.renewal_number) === nth ? `${facts.email}:renewal_${nth}` : null;
      }
      return `${facts.email}:${ref}:${data.period_end || Date.now()}`;
    }

    case "nth_purchase":
      return facts.purchases === num(cfg.count, 5)
        ? `${facts.email}:purchase_${num(cfg.count, 5)}`
        : null;

    case "lifetime_spend_over":
      return facts.lifetimeSpend >= num(cfg.amount, 250)
        ? `${facts.email}:spend_${num(cfg.amount, 250)}`
        : null;

    case "single_purchase_over":
      return num(data.amount) >= num(cfg.amount, 75) ? `${facts.email}:${ref}:big_purchase` : null;

    default:
      return null;
  }
}

async function alreadyQueued(
  supabase: SupabaseClient,
  rule: Rule,
  email: string,
  occurrenceKey: string,
): Promise<boolean> {
  // Exact occurrence already handled?
  const { data: exact } = await supabase
    .from("conditional_email_sends")
    .select("id")
    .eq("rule_id", rule.id)
    .eq("occurrence_key", occurrenceKey)
    .maybeSingle();
  if (exact) return true;

  if (rule.repeat_policy === "once_ever") {
    const { data } = await supabase
      .from("conditional_email_sends")
      .select("id")
      .eq("rule_id", rule.id)
      .eq("customer_email", lower(email))
      .neq("status", "failed")
      .limit(1);
    if (data && data.length > 0) return true;
  }

  if (rule.repeat_policy === "once_per_window") {
    const windowDays = rule.repeat_window_days || 30;
    const { data } = await supabase
      .from("conditional_email_sends")
      .select("id")
      .eq("rule_id", rule.id)
      .eq("customer_email", lower(email))
      .neq("status", "failed")
      .gte("created_at", daysAgo(windowDays).toISOString())
      .limit(1);
    if (data && data.length > 0) return true;
  }

  return false;
}

async function queueSend(
  supabase: SupabaseClient,
  rule: Rule,
  candidate: Candidate,
): Promise<"queued" | "skipped"> {
  if (await alreadyQueued(supabase, rule, candidate.email, candidate.occurrenceKey)) return "skipped";

  if (rule.daily_cap) {
    const { count } = await supabase
      .from("conditional_email_sends")
      .select("*", { count: "exact", head: true })
      .eq("rule_id", rule.id)
      .gte("created_at", daysAgo(1).toISOString());
    if ((count || 0) >= rule.daily_cap) return "skipped";
  }

  const scheduledFor = new Date(Date.now() + (rule.delay_minutes || 0) * 60000).toISOString();

  const { error } = await supabase.from("conditional_email_sends").insert({
    rule_id: rule.id,
    customer_email: lower(candidate.email),
    customer_name: candidate.name ?? null,
    user_id: candidate.userId ?? null,
    occurrence_key: candidate.occurrenceKey,
    status: "queued",
    scheduled_for: scheduledFor,
    payload: candidate.payload || {},
  });

  if (error) {
    // Unique violation = another worker queued it first
    if ((error as any).code === "23505") return "skipped";
    console.error("Failed to queue conditional email:", error);
    return "skipped";
  }

  await supabase
    .from("conditional_email_rules")
    .update({ last_triggered_at: new Date().toISOString() })
    .eq("id", rule.id);

  return "queued";
}

// ------------------------- Sweep (time based) -------------------------

async function sweepCandidates(supabase: SupabaseClient, rule: Rule): Promise<Candidate[]> {
  const cfg = rule.trigger_config || {};
  const out: Candidate[] = [];
  const today = new Date();

  const pushBooking = (b: any, suffix: string) =>
    out.push({
      email: lower(b.customer_email),
      name: b.customer_name,
      userId: b.user_id,
      occurrenceKey: `${lower(b.customer_email)}:${b.id}:${suffix}`,
      payload: { booking_id: b.id, session_date: b.session_date, session_time: b.session_time },
    });

  switch (rule.trigger_type) {
    case "session_reminder": {
      const hours = num(cfg.hours_before, 24);
      const target = new Date(Date.now() + hours * 3600000);
      const { data } = await supabase
        .from("bookings")
        .select("id, customer_email, customer_name, user_id, session_date, session_time")
        .eq("payment_status", "paid")
        .eq("session_date", isoDate(target));
      for (const b of data || []) pushBooking(b, `reminder_${hours}`);
      break;
    }

    case "post_session_followup":
    case "first_session_completed":
    case "nth_session":
    case "lapsed_days":
    case "regular_lapsed":
    case "lifetime_spend_over":
    case "nth_purchase":
    case "intro_offer_used_up": {
      // These need per-customer history: walk recent paid bookings' customers.
      const lookbackDays =
        rule.trigger_type === "lapsed_days" || rule.trigger_type === "regular_lapsed" ? 400 : 30;
      const { data } = await supabase
        .from("bookings")
        .select("id, customer_email, customer_name, user_id, session_date, session_time")
        .eq("payment_status", "paid")
        .gte("session_date", isoDate(daysAgo(lookbackDays)))
        .order("session_date", { ascending: false })
        .limit(2000);

      const seen = new Set<string>();
      for (const b of data || []) {
        const email = lower(b.customer_email);
        if (!email || seen.has(email)) continue;
        seen.add(email);

        const { data: history } = await supabase
          .from("bookings")
          .select("id, session_date, session_time")
          .eq("customer_email", email)
          .eq("payment_status", "paid")
          .order("session_date", { ascending: true });

        const past = (history || []).filter((h: any) => h.session_date <= isoDate(today));
        const last = past[past.length - 1];

        if (rule.trigger_type === "first_session_completed") {
          if (past.length === 1) {
            out.push({
              email,
              name: b.customer_name,
              userId: b.user_id,
              occurrenceKey: `${email}:first_session_done`,
            });
          }
        } else if (rule.trigger_type === "nth_session") {
          const target = num(cfg.count, 3);
          if (past.length >= target) {
            out.push({ email, name: b.customer_name, userId: b.user_id, occurrenceKey: `${email}:session_${target}` });
          }
        } else if (rule.trigger_type === "post_session_followup") {
          const hours = num(cfg.hours_after, 24);
          if (last) {
            const when = new Date(`${last.session_date}T${last.session_time || "12:00:00"}Z`).getTime();
            const due = when + hours * 3600000;
            if (due <= Date.now() && due > Date.now() - 36 * 3600000) {
              out.push({
                email,
                name: b.customer_name,
                userId: b.user_id,
                occurrenceKey: `${email}:${last.id}:followup`,
              });
            }
          }
        } else if (rule.trigger_type === "lapsed_days" || rule.trigger_type === "regular_lapsed") {
          const days = num(cfg.days, rule.trigger_type === "lapsed_days" ? 30 : 45);
          const minSessions = rule.trigger_type === "regular_lapsed" ? num(cfg.min_sessions, 5) : 1;
          if (!last) continue;
          const daysSince = Math.floor(
            (Date.now() - new Date(`${last.session_date}T12:00:00Z`).getTime()) / 86400000,
          );
          if (daysSince >= days && past.length >= minSessions) {
            out.push({
              email,
              name: b.customer_name,
              userId: b.user_id,
              occurrenceKey: `${email}:lapsed_${days}_${last.id}`,
            });
          }
        } else if (rule.trigger_type === "lifetime_spend_over" || rule.trigger_type === "nth_purchase") {
          const facts = await loadFacts(supabase, email);
          if (
            rule.trigger_type === "lifetime_spend_over"
              ? facts.lifetimeSpend >= num(cfg.amount, 250)
              : facts.purchases >= num(cfg.count, 5)
          ) {
            out.push({
              email,
              name: b.customer_name,
              userId: b.user_id,
              occurrenceKey:
                rule.trigger_type === "lifetime_spend_over"
                  ? `${email}:spend_${num(cfg.amount, 250)}`
                  : `${email}:purchase_${num(cfg.count, 5)}`,
            });
          }
        } else if (rule.trigger_type === "intro_offer_used_up") {
          const { data: tokens } = await supabase
            .from("customer_tokens")
            .select("tokens_remaining")
            .eq("customer_email", email);
          const remaining = (tokens || []).reduce((s, t: any) => s + num(t.tokens_remaining), 0);
          if ((tokens || []).length > 0 && remaining === 0) {
            out.push({ email, name: b.customer_name, userId: b.user_id, occurrenceKey: `${email}:intro_used_up` });
          }
        }
      }
      break;
    }

    case "abandoned_checkout": {
      const hours = num(cfg.hours, 6);
      const cutoff = new Date(Date.now() - hours * 3600000).toISOString();
      const { data } = await supabase
        .from("bookings")
        .select("id, customer_email, customer_name, user_id, created_at, session_date")
        .eq("payment_status", "pending")
        .lte("created_at", cutoff)
        .gte("created_at", daysAgo(7).toISOString());
      for (const b of data || []) pushBooking(b, "abandoned");
      break;
    }

    case "no_booking_after_signup": {
      const days = num(cfg.days, 7);
      const { data } = await supabase
        .from("customers")
        .select("email, full_name, created_at")
        .lte("created_at", daysAgo(days).toISOString())
        .gte("created_at", daysAgo(days + 3).toISOString());
      for (const c of data || []) {
        const email = lower(c.email);
        const { count } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("customer_email", email);
        if ((count || 0) === 0) {
          out.push({ email, name: c.full_name, occurrenceKey: `${email}:no_booking_${days}` });
        }
      }
      break;
    }

    case "membership_expiring": {
      const days = num(cfg.days, 7);
      const target = isoDate(new Date(Date.now() + days * 86400000));
      const { data } = await supabase
        .from("memberships")
        .select("id, customer_email, customer_name, user_id, end_date")
        .eq("status", "active")
        .eq("end_date", target);
      for (const m of data || []) {
        out.push({
          email: lower(m.customer_email),
          name: m.customer_name,
          userId: m.user_id,
          occurrenceKey: `${lower(m.customer_email)}:${m.id}:expiring_${days}`,
          payload: { membership_id: m.id, end_date: m.end_date },
        });
      }
      break;
    }

    case "membership_sessions_low": {
      const remaining = num(cfg.remaining, 1);
      const { data } = await supabase
        .from("memberships")
        .select("id, customer_email, customer_name, user_id, sessions_remaining, membership_type, last_session_reset")
        .eq("status", "active")
        .neq("membership_type", "unlimited")
        .lte("sessions_remaining", remaining);
      for (const m of data || []) {
        out.push({
          email: lower(m.customer_email),
          name: m.customer_name,
          userId: m.user_id,
          occurrenceKey: `${lower(m.customer_email)}:${m.id}:low_${remaining}_${m.last_session_reset || ""}`,
          payload: { membership_id: m.id, sessions_remaining: m.sessions_remaining },
        });
      }
      break;
    }

    case "member_unused_period": {
      const days = num(cfg.days, 14);
      const { data } = await supabase
        .from("memberships")
        .select("id, customer_email, customer_name, user_id, last_session_reset, sessions_per_week, sessions_remaining")
        .eq("status", "active");
      for (const m of data || []) {
        const since = m.last_session_reset ? new Date(m.last_session_reset) : null;
        if (!since) continue;
        const daysIn = Math.floor((Date.now() - since.getTime()) / 86400000);
        if (daysIn < days) continue;
        const { count } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("customer_email", lower(m.customer_email))
          .eq("payment_status", "paid")
          .gte("created_at", since.toISOString());
        if ((count || 0) === 0) {
          out.push({
            email: lower(m.customer_email),
            name: m.customer_name,
            userId: m.user_id,
            occurrenceKey: `${lower(m.customer_email)}:${m.id}:unused_${isoDate(since)}`,
          });
        }
      }
      break;
    }

    case "tokens_remaining":
    case "tokens_expiring":
    case "intro_offer_unused": {
      const { data } = await supabase
        .from("customer_tokens")
        .select("id, customer_email, tokens_remaining, expires_at, created_at, notes");
      for (const t of data || []) {
        const email = lower(t.customer_email);
        if (!email) continue;

        if (rule.trigger_type === "tokens_remaining") {
          if (num(t.tokens_remaining) === num(cfg.remaining, 1)) {
            out.push({ email, occurrenceKey: `${email}:${t.id}:tokens_${num(cfg.remaining, 1)}` });
          }
        } else if (rule.trigger_type === "tokens_expiring") {
          const days = num(cfg.days, 7);
          if (!t.expires_at || num(t.tokens_remaining) <= 0) continue;
          if (isoDate(new Date(t.expires_at)) === isoDate(new Date(Date.now() + days * 86400000))) {
            out.push({ email, occurrenceKey: `${email}:${t.id}:tokens_expiring_${days}` });
          }
        } else {
          const days = num(cfg.days, 14);
          const created = new Date(t.created_at).getTime();
          const isIntro = /intro/i.test(t.notes || "");
          if (!isIntro) continue;
          const daysSince = Math.floor((Date.now() - created) / 86400000);
          if (daysSince >= days && num(t.tokens_remaining) === 3) {
            out.push({ email, occurrenceKey: `${email}:${t.id}:intro_unused_${days}` });
          }
        }
      }
      break;
    }

    case "credit_expiring":
    case "credit_unspent": {
      const days = num(cfg.days, 30);
      const { data } = await supabase
        .from("customer_credits")
        .select("id, customer_email, credit_balance, expires_at, redeemed_at");
      for (const c of data || []) {
        const email = lower(c.customer_email);
        if (!email || num(c.credit_balance) <= 0) continue;
        if (rule.trigger_type === "credit_expiring") {
          if (c.expires_at && isoDate(new Date(c.expires_at)) === isoDate(new Date(Date.now() + days * 86400000))) {
            out.push({ email, occurrenceKey: `${email}:${c.id}:credit_expiring_${days}` });
          }
        } else {
          const daysSince = Math.floor((Date.now() - new Date(c.redeemed_at).getTime()) / 86400000);
          if (daysSince >= days) {
            out.push({ email, occurrenceKey: `${email}:${c.id}:credit_unspent_${days}` });
          }
        }
      }
      break;
    }

    case "gift_card_unredeemed": {
      const days = num(cfg.days, 30);
      const { data } = await supabase
        .from("gift_cards")
        .select("id, purchaser_email, purchaser_name, recipient_email, created_at, is_redeemed")
        .eq("payment_status", "paid")
        .eq("is_redeemed", false)
        .lte("created_at", daysAgo(days).toISOString())
        .gte("created_at", daysAgo(days + 3).toISOString());
      for (const g of data || []) {
        const email = lower(g.recipient_email || g.purchaser_email);
        if (!email) continue;
        out.push({
          email,
          name: g.purchaser_name,
          occurrenceKey: `${email}:${g.id}:unredeemed_${days}`,
          payload: { gift_card_id: g.id },
        });
      }
      break;
    }

    case "first_visit_anniversary": {
      const { data } = await supabase
        .from("bookings")
        .select("customer_email, customer_name, user_id, session_date")
        .eq("payment_status", "paid")
        .order("session_date", { ascending: true })
        .limit(5000);
      const first = new Map<string, any>();
      for (const b of data || []) {
        const email = lower(b.customer_email);
        if (email && !first.has(email)) first.set(email, b);
      }
      const mmdd = isoDate(today).slice(5);
      for (const [email, b] of first) {
        if (String(b.session_date).slice(5) !== mmdd) continue;
        if (String(b.session_date).slice(0, 4) === isoDate(today).slice(0, 4)) continue;
        out.push({
          email,
          name: b.customer_name,
          userId: b.user_id,
          occurrenceKey: `${email}:anniversary_${isoDate(today).slice(0, 4)}`,
        });
      }
      break;
    }

    case "customer_tagged": {
      const tag = String(cfg.tag || "").trim();
      if (!tag) break;
      const { data } = await supabase
        .from("customers")
        .select("email, full_name, tags")
        .contains("tags", [tag]);
      for (const c of data || []) {
        out.push({ email: lower(c.email), name: c.full_name, occurrenceKey: `${lower(c.email)}:tag_${tag}` });
      }
      break;
    }

    default:
      break;
  }

  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = serviceClient();
    const cronSecret = Deno.env.get("CONDITIONAL_EMAILS_CRON_SECRET");
    const isCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
    if (!isCron) {
      const authError = await requireAdmin(req, supabase);
      if (authError) return json({ error: authError.message }, authError.status);
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || (body.event ? "event" : "sweep");

    const { data: settings } = await supabase
      .from("conditional_email_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (settings?.kill_switch) return json({ queued: 0, skipped: 0, note: "kill switch is on" });

    const { data: allRules } = await supabase
      .from("conditional_email_rules")
      .select("*")
      .eq("is_active", true);
    const rules = (allRules || []) as Rule[];

    let queued = 0;
    let skipped = 0;

    if (mode === "event") {
      const event = body.event || {};
      const email = lower(event.email);
      if (!email) return json({ error: "event.email is required" }, 400);

      const triggerIds = EVENT_TRIGGERS[event.type] || [];
      const relevant = rules.filter((r) => triggerIds.includes(r.trigger_type));
      if (relevant.length === 0) return json({ queued: 0, skipped: 0 });

      const facts = await loadFacts(supabase, email);
      if (event.name && !facts.name) facts.name = event.name;

      for (const rule of relevant) {
        if (!passesFilters(rule, facts)) {
          skipped++;
          continue;
        }
        const occurrenceKey = matchEvent(rule, event, facts);
        if (!occurrenceKey) {
          skipped++;
          continue;
        }
        const result = await queueSend(supabase, rule, {
          email,
          name: event.name || facts.name,
          userId: event.user_id || null,
          occurrenceKey,
          payload: { event_type: event.type, ...(event.data || {}) },
        });
        result === "queued" ? queued++ : skipped++;
      }
    } else if (mode === "manual") {
      const rule = rules.find((r) => r.id === body.rule_id) ||
        ((await supabase.from("conditional_email_rules").select("*").eq("id", body.rule_id).maybeSingle())
          .data as Rule | null);
      if (!rule) return json({ error: "Rule not found" }, 404);

      for (const rawEmail of body.emails || []) {
        const email = lower(rawEmail);
        if (!email) continue;
        const facts = await loadFacts(supabase, email);
        if (!passesFilters(rule, facts)) {
          skipped++;
          continue;
        }
        const result = await queueSend(supabase, rule, {
          email,
          name: facts.name,
          occurrenceKey: `${email}:manual_${Date.now()}`,
          payload: { manual: true },
        });
        result === "queued" ? queued++ : skipped++;
      }
    } else {
      // sweep
      for (const rule of rules) {
        const candidates = await sweepCandidates(supabase, rule);
        for (const candidate of candidates) {
          const facts = await loadFacts(supabase, candidate.email);
          if (!passesFilters(rule, facts)) {
            skipped++;
            continue;
          }
          const result = await queueSend(supabase, rule, {
            ...candidate,
            name: candidate.name || facts.name,
          });
          result === "queued" ? queued++ : skipped++;
        }
      }
    }

    console.log(`conditional-emails-evaluate (${mode}): queued=${queued} skipped=${skipped}`);
    return json({ queued, skipped, mode });
  } catch (error) {
    console.error("conditional-emails-evaluate error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
