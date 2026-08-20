export type TriggerFieldType = "number" | "amount" | "text";

export interface TriggerField {
  key: string;
  label: string;
  type: TriggerFieldType;
  default: number | string;
  suffix?: string;
  min?: number;
}

export interface TriggerDefinition {
  id: string;
  label: string;
  group: string;
  /** "event" fires instantly from app/webhook events, "sweep" is evaluated by the daily job. */
  kind: "event" | "sweep" | "manual";
  fields?: TriggerField[];
  summary: (cfg: Record<string, any>) => string;
}

const n = (cfg: Record<string, any>, key: string, fallback: number) =>
  Number(cfg?.[key] ?? fallback);

export const TRIGGER_GROUPS = [
  "Bookings & sessions",
  "Lapsed & re-engagement",
  "Memberships",
  "Intro offer, tokens & credit",
  "Gift cards",
  "Spend & value",
  "Lifecycle",
] as const;

export const TRIGGERS: TriggerDefinition[] = [
  // ---------------- Bookings & sessions ----------------
  {
    id: "booking_created",
    label: "Booking made",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "As soon as a customer makes and pays for a booking",
  },
  {
    id: "nth_session",
    label: "Nth completed session",
    group: "Bookings & sessions",
    kind: "sweep",
    fields: [{ key: "count", label: "Session number", type: "number", default: 3, min: 1 }],
    summary: (c) => `When a customer has completed ${n(c, "count", 3)} paid sessions`,
  },
  {
    id: "first_booking",
    label: "First ever booking",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "When a customer makes their very first booking",
  },
  {
    id: "first_session_completed",
    label: "First session completed",
    group: "Bookings & sessions",
    kind: "sweep",
    summary: () => "After a customer's first session has taken place",
  },
  {
    id: "first_private_booking",
    label: "First private booking",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "The first time a customer books a private session",
  },
  {
    id: "first_communal_booking",
    label: "First communal booking",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "The first time a customer books a communal session",
  },
  {
    id: "booking_with_guests",
    label: "Booked with guests",
    group: "Bookings & sessions",
    kind: "event",
    fields: [{ key: "min_guests", label: "Minimum guests", type: "number", default: 2, min: 2 }],
    summary: (c) => `When a booking includes ${n(c, "min_guests", 2)} or more guests`,
  },
  {
    id: "session_reminder",
    label: "Upcoming session reminder",
    group: "Bookings & sessions",
    kind: "sweep",
    fields: [{ key: "hours_before", label: "Hours before session", type: "number", default: 24, min: 1 }],
    summary: (c) => `${n(c, "hours_before", 24)} hours before a booked session`,
  },
  {
    id: "post_session_followup",
    label: "Post-session follow-up",
    group: "Bookings & sessions",
    kind: "sweep",
    fields: [{ key: "hours_after", label: "Hours after session", type: "number", default: 24, min: 1 }],
    summary: (c) => `${n(c, "hours_after", 24)} hours after a completed session`,
  },
  {
    id: "booking_cancelled",
    label: "Booking cancelled",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "When a booking is cancelled",
  },
  {
    id: "booking_refunded",
    label: "Booking refunded",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "When a booking is refunded",
  },
  {
    id: "booking_rescheduled",
    label: "Booking rescheduled",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "When a customer reschedules a booking",
  },

  // ---------------- Lapsed & re-engagement ----------------
  {
    id: "lapsed_days",
    label: "Hasn't booked in N days",
    group: "Lapsed & re-engagement",
    kind: "sweep",
    fields: [{ key: "days", label: "Days since last session", type: "number", default: 30, min: 1 }],
    summary: (c) => `When a customer hasn't had a session for ${n(c, "days", 30)} days`,
  },
  {
    id: "regular_lapsed",
    label: "Regular customer gone quiet",
    group: "Lapsed & re-engagement",
    kind: "sweep",
    fields: [
      { key: "min_sessions", label: "Past sessions at least", type: "number", default: 5, min: 1 },
      { key: "days", label: "Days since last session", type: "number", default: 45, min: 1 },
    ],
    summary: (c) =>
      `When a customer with ${n(c, "min_sessions", 5)}+ sessions hasn't been in for ${n(c, "days", 45)} days`,
  },
  {
    id: "no_booking_after_signup",
    label: "Signed up but never booked",
    group: "Lapsed & re-engagement",
    kind: "sweep",
    fields: [{ key: "days", label: "Days since sign-up", type: "number", default: 7, min: 1 }],
    summary: (c) => `${n(c, "days", 7)} days after sign-up with no booking made`,
  },
  {
    id: "abandoned_checkout",
    label: "Abandoned checkout",
    group: "Lapsed & re-engagement",
    kind: "sweep",
    fields: [{ key: "hours", label: "Hours left unpaid", type: "number", default: 6, min: 1 }],
    summary: (c) => `When a booking has been left unpaid for ${n(c, "hours", 6)} hours`,
  },

  // ---------------- Memberships ----------------
  {
    id: "membership_started",
    label: "Membership started",
    group: "Memberships",
    kind: "event",
    summary: () => "When a customer starts a membership",
  },
  {
    id: "membership_renewed",
    label: "Membership renewed",
    group: "Memberships",
    kind: "event",
    fields: [{ key: "nth", label: "Renewal number (0 = every renewal)", type: "number", default: 0, min: 0 }],
    summary: (c) =>
      n(c, "nth", 0) > 0
        ? `On a member's renewal number ${n(c, "nth", 0)}`
        : "Every time a membership renews",
  },
  {
    id: "membership_cancelled",
    label: "Membership cancelled",
    group: "Memberships",
    kind: "event",
    summary: () => "When a membership is cancelled",
  },
  {
    id: "membership_plan_changed",
    label: "Membership plan changed",
    group: "Memberships",
    kind: "event",
    summary: () => "When a member upgrades or downgrades their plan",
  },
  {
    id: "membership_expiring",
    label: "Membership expiring soon",
    group: "Memberships",
    kind: "sweep",
    fields: [{ key: "days", label: "Days before it ends", type: "number", default: 7, min: 1 }],
    summary: (c) => `${n(c, "days", 7)} days before a membership ends`,
  },
  {
    id: "membership_sessions_low",
    label: "Member's sessions nearly used",
    group: "Memberships",
    kind: "sweep",
    fields: [{ key: "remaining", label: "Sessions remaining at most", type: "number", default: 1, min: 0 }],
    summary: (c) => `When a member has ${n(c, "remaining", 1)} or fewer sessions left this period`,
  },
  {
    id: "member_unused_period",
    label: "Member hasn't used their sessions",
    group: "Memberships",
    kind: "sweep",
    fields: [{ key: "days", label: "Days into the period", type: "number", default: 14, min: 1 }],
    summary: (c) => `When a member has used nothing ${n(c, "days", 14)} days into their period`,
  },

  // ---------------- Intro offer, tokens & credit ----------------
  {
    id: "intro_offer_purchased",
    label: "Intro offer purchased",
    group: "Intro offer, tokens & credit",
    kind: "event",
    summary: () => "When a customer buys the intro offer",
  },
  {
    id: "tokens_remaining",
    label: "Tokens remaining reaches N",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    fields: [{ key: "remaining", label: "Tokens remaining", type: "number", default: 1, min: 0 }],
    summary: (c) => `When a customer has ${n(c, "remaining", 1)} token(s) left`,
  },
  {
    id: "intro_offer_used_up",
    label: "Intro offer fully used",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    summary: () => "When a customer has used all of their intro offer sessions",
  },
  {
    id: "intro_offer_unused",
    label: "Intro offer unused",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    fields: [{ key: "days", label: "Days since purchase", type: "number", default: 14, min: 1 }],
    summary: (c) => `${n(c, "days", 14)} days after buying the intro offer with tokens unused`,
  },
  {
    id: "tokens_expiring",
    label: "Tokens expiring soon",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    fields: [{ key: "days", label: "Days before expiry", type: "number", default: 7, min: 1 }],
    summary: (c) => `${n(c, "days", 7)} days before a customer's tokens expire`,
  },
  {
    id: "credit_expiring",
    label: "Gift card credit expiring soon",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    fields: [{ key: "days", label: "Days before expiry", type: "number", default: 30, min: 1 }],
    summary: (c) => `${n(c, "days", 30)} days before gift card credit expires`,
  },
  {
    id: "credit_unspent",
    label: "Credit left unspent",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    fields: [{ key: "days", label: "Days since redeeming", type: "number", default: 30, min: 1 }],
    summary: (c) => `${n(c, "days", 30)} days after redeeming, with credit still unspent`,
  },

  // ---------------- Gift cards ----------------
  {
    id: "gift_card_purchased",
    label: "Gift card purchased",
    group: "Gift cards",
    kind: "event",
    summary: () => "When a customer buys a gift card (sent to the purchaser)",
  },
  {
    id: "gift_card_redeemed",
    label: "Gift card redeemed",
    group: "Gift cards",
    kind: "event",
    summary: () => "When a gift card is redeemed",
  },
  {
    id: "gift_card_unredeemed",
    label: "Gift card not redeemed",
    group: "Gift cards",
    kind: "sweep",
    fields: [{ key: "days", label: "Days since purchase", type: "number", default: 30, min: 1 }],
    summary: (c) => `${n(c, "days", 30)} days after purchase with the gift card still unredeemed`,
  },

  // ---------------- Spend & value ----------------
  {
    id: "lifetime_spend_over",
    label: "Lifetime spend passes an amount",
    group: "Spend & value",
    kind: "sweep",
    fields: [{ key: "amount", label: "Amount", type: "amount", default: 250, min: 1 }],
    summary: (c) => `When a customer's total spend passes £${n(c, "amount", 250)}`,
  },
  {
    id: "nth_purchase",
    label: "Nth purchase of any type",
    group: "Spend & value",
    kind: "sweep",
    fields: [{ key: "count", label: "Purchase number", type: "number", default: 5, min: 1 }],
    summary: (c) => `On a customer's purchase number ${n(c, "count", 5)}`,
  },
  {
    id: "single_purchase_over",
    label: "Single purchase over an amount",
    group: "Spend & value",
    kind: "event",
    fields: [{ key: "amount", label: "Amount", type: "amount", default: 75, min: 1 }],
    summary: (c) => `When a single purchase is more than £${n(c, "amount", 75)}`,
  },

  // ---------------- Lifecycle ----------------
  {
    id: "account_created",
    label: "Account created",
    group: "Lifecycle",
    kind: "event",
    summary: () => "When someone creates an account",
  },
  {
    id: "first_visit_anniversary",
    label: "Anniversary of first visit",
    group: "Lifecycle",
    kind: "sweep",
    summary: () => "Each year on the anniversary of a customer's first visit",
  },
  {
    id: "customer_tagged",
    label: "Customer given a tag in admin",
    group: "Lifecycle",
    kind: "sweep",
    fields: [{ key: "tag", label: "Tag", type: "text", default: "vip" }],
    summary: (c) => `When a customer is tagged "${c?.tag || "vip"}" in admin`,
  },
  {
    id: "contact_message_resolved",
    label: "Contact message resolved",
    group: "Lifecycle",
    kind: "event",
    summary: () => "When a contact form message is marked as resolved",
  },
  {
    id: "manual",
    label: "Manual only (run on demand)",
    group: "Lifecycle",
    kind: "manual",
    summary: () => "Only sent when you run the rule manually",
  },
];

export const TRIGGER_MAP: Record<string, TriggerDefinition> = Object.fromEntries(
  TRIGGERS.map((t) => [t.id, t]),
);

export function describeTrigger(triggerType: string, cfg: Record<string, any> = {}): string {
  const def = TRIGGER_MAP[triggerType];
  if (!def) return triggerType;
  return def.summary(cfg || {});
}

export const REPEAT_POLICIES = [
  { value: "once_ever", label: "Once per customer, ever" },
  { value: "once_per_window", label: "Once per customer per N days" },
  { value: "every_time", label: "Every time it happens" },
];

export const MEMBERSHIP_FILTERS = [
  { value: "any", label: "Any customer" },
  { value: "member", label: "Active members only" },
  { value: "non_member", label: "Non-members only" },
];
