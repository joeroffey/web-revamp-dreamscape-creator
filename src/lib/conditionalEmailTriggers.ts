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
  description: string;
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
    description:
      "Fires the moment a booking is marked as paid. Use for a quick 'see you soon' confirmation or pre-visit tips.",
  },
  {
    id: "nth_session",
    label: "Nth completed session",
    group: "Bookings & sessions",
    kind: "sweep",
    fields: [{ key: "count", label: "Session number", type: "number", default: 3, min: 1 }],
    summary: (c) => `When a customer has completed ${n(c, "count", 3)} paid sessions`,
    description:
      "Perfect for loyalty milestones. Set the session number (e.g. 3) and the email sends once that many paid sessions have actually taken place.",
  },
  {
    id: "first_booking",
    label: "First ever booking",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "When a customer makes their very first booking",
    description:
      "Fires when a customer makes their first booking with you. Use for a welcome email with arrival guidance.",
  },
  {
    id: "first_session_completed",
    label: "First session completed",
    group: "Bookings & sessions",
    kind: "sweep",
    summary: () => "After a customer's first session has taken place",
    description:
      "Sends after the customer's first session has started, not when it was booked. Good for a post-first-visit check-in.",
  },
  {
    id: "first_private_booking",
    label: "First private booking",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "The first time a customer books a private session",
    description:
      "Fires only the first time a customer books a private session. Use to explain what to expect from a private hire.",
  },
  {
    id: "first_communal_booking",
    label: "First communal booking",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "The first time a customer books a communal session",
    description:
      "Fires only the first time a customer books a communal session. Useful for explaining shared-session etiquette.",
  },
  {
    id: "booking_with_guests",
    label: "Booked with guests",
    group: "Bookings & sessions",
    kind: "event",
    fields: [{ key: "min_guests", label: "Minimum guests", type: "number", default: 2, min: 2 }],
    summary: (c) => `When a booking includes ${n(c, "min_guests", 2)} or more guests`,
    description:
      "Fires when a booking includes the chosen number of guests or more. Use to thank them for bringing a group or share group-specific info.",
  },
  {
    id: "session_reminder",
    label: "Upcoming session reminder",
    group: "Bookings & sessions",
    kind: "sweep",
    fields: [{ key: "hours_before", label: "Hours before session", type: "number", default: 24, min: 1 }],
    summary: (c) => `${n(c, "hours_before", 24)} hours before a booked session`,
    description:
      "Checked daily. Sends the chosen number of hours before a customer's upcoming paid session. Great for arrival reminders.",
  },
  {
    id: "post_session_followup",
    label: "Post-session follow-up",
    group: "Bookings & sessions",
    kind: "sweep",
    fields: [{ key: "hours_after", label: "Hours after session", type: "number", default: 24, min: 1 }],
    summary: (c) => `${n(c, "hours_after", 24)} hours after a completed session`,
    description:
      "Checked daily. Sends the chosen number of hours after a session has finished. Use for feedback requests or recovery tips.",
  },
  {
    id: "booking_cancelled",
    label: "Booking cancelled",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "When a booking is cancelled",
    description:
      "Fires when a booking is cancelled by the customer or admin. Use for a polite 'sorry to see you go' or rebooking prompt.",
  },
  {
    id: "booking_refunded",
    label: "Booking refunded",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "When a booking is refunded",
    description:
      "Fires when a booking is fully or partially refunded. Use to confirm the refund and keep the relationship warm.",
  },
  {
    id: "booking_rescheduled",
    label: "Booking rescheduled",
    group: "Bookings & sessions",
    kind: "event",
    summary: () => "When a customer reschedules a booking",
    description:
      "Fires when a booking is moved to a new slot. Use to confirm the new time and re-share arrival details.",
  },

  // ---------------- Lapsed & re-engagement ----------------
  {
    id: "lapsed_days",
    label: "Hasn't booked in N days",
    group: "Lapsed & re-engagement",
    kind: "sweep",
    fields: [{ key: "days", label: "Days since last session", type: "number", default: 30, min: 1 }],
    summary: (c) => `When a customer hasn't had a session for ${n(c, "days", 30)} days`,
    description:
      "Win-back trigger. Checked daily and sends to anyone whose last paid session was the chosen number of days ago or longer.",
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
    description:
      "Targeted win-back. Only sends to customers with at least the chosen number of past sessions who have now been absent for the chosen number of days.",
  },
  {
    id: "no_booking_after_signup",
    label: "Signed up but never booked",
    group: "Lapsed & re-engagement",
    kind: "sweep",
    fields: [{ key: "days", label: "Days since sign-up", type: "number", default: 7, min: 1 }],
    summary: (c) => `${n(c, "days", 7)} days after sign-up with no booking made`,
    description:
      "Checked daily. Sends to accounts created the chosen number of days ago that have never made a paid booking. Good for a first-timer nudge.",
  },
  {
    id: "abandoned_checkout",
    label: "Abandoned checkout",
    group: "Lapsed & re-engagement",
    kind: "sweep",
    fields: [{ key: "hours", label: "Hours left unpaid", type: "number", default: 6, min: 1 }],
    summary: (c) => `When a booking has been left unpaid for ${n(c, "hours", 6)} hours`,
    description:
      "Checked daily. Sends to bookings still in pending/unpaid status after the chosen number of hours. Use to recover lost sales.",
  },

  // ---------------- Memberships ----------------
  {
    id: "membership_started",
    label: "Membership started",
    group: "Memberships",
    kind: "event",
    summary: () => "When a customer starts a membership",
    description:
      "Fires when a new membership subscription is created and paid. Use for a membership welcome email.",
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
    description:
      "Fires on successful membership renewal. Set 0 for every renewal, or a specific number (e.g. 3) for anniversary-style rewards.",
  },
  {
    id: "membership_cancelled",
    label: "Membership cancelled",
    group: "Memberships",
    kind: "event",
    summary: () => "When a membership is cancelled",
    description:
      "Fires when a membership is cancelled. Use for a save attempt, feedback request, or simple confirmation.",
  },
  {
    id: "membership_plan_changed",
    label: "Membership plan changed",
    group: "Memberships",
    kind: "event",
    summary: () => "When a member upgrades or downgrades their plan",
    description:
      "Fires when a member changes plan tier. Use to confirm the new plan and what it includes.",
  },
  {
    id: "membership_expiring",
    label: "Membership expiring soon",
    group: "Memberships",
    kind: "sweep",
    fields: [{ key: "days", label: "Days before it ends", type: "number", default: 7, min: 1 }],
    summary: (c) => `${n(c, "days", 7)} days before a membership ends`,
    description:
      "Checked daily. Sends the chosen number of days before a membership's current period ends. Use for renewal reminders.",
  },
  {
    id: "membership_sessions_low",
    label: "Member's sessions nearly used",
    group: "Memberships",
    kind: "sweep",
    fields: [{ key: "remaining", label: "Sessions remaining at most", type: "number", default: 1, min: 0 }],
    summary: (c) => `When a member has ${n(c, "remaining", 1)} or fewer sessions left this period`,
    description:
      "Checked daily. Sends when a member has used most of their included sessions. Use to encourage booking before the period resets.",
  },
  {
    id: "member_unused_period",
    label: "Member hasn't used their sessions",
    group: "Memberships",
    kind: "sweep",
    fields: [{ key: "days", label: "Days into the period", type: "number", default: 14, min: 1 }],
    summary: (c) => `When a member has used nothing ${n(c, "days", 14)} days into their period`,
    description:
      "Checked daily. Sends if a member has not used any sessions after the chosen number of days into their billing period. Use for engagement nudges.",
  },

  // ---------------- Intro offer, tokens & credit ----------------
  {
    id: "intro_offer_purchased",
    label: "Intro offer purchased",
    group: "Intro offer, tokens & credit",
    kind: "event",
    summary: () => "When a customer buys the intro offer",
    description:
      "Fires when the 3-for-£35 intro offer is purchased. Use for a welcome email explaining how to redeem tokens.",
  },
  {
    id: "tokens_remaining",
    label: "Tokens remaining reaches N",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    fields: [{ key: "remaining", label: "Tokens remaining", type: "number", default: 1, min: 0 }],
    summary: (c) => `When a customer has ${n(c, "remaining", 1)} token(s) left`,
    description:
      "Checked daily. Sends when a customer's token balance drops to the chosen number. Use to push membership conversion before tokens run out.",
  },
  {
    id: "intro_offer_used_up",
    label: "Intro offer fully used",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    summary: () => "When a customer has used all of their intro offer sessions",
    description:
      "Checked daily. Sends once all intro-offer tokens have been redeemed. Perfect time to suggest a membership.",
  },
  {
    id: "intro_offer_unused",
    label: "Intro offer unused",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    fields: [{ key: "days", label: "Days since purchase", type: "number", default: 14, min: 1 }],
    summary: (c) => `${n(c, "days", 14)} days after buying the intro offer with tokens unused`,
    description:
      "Checked daily. Sends if a customer still has unused intro tokens the chosen number of days after purchase. Use to encourage a first visit.",
  },
  {
    id: "tokens_expiring",
    label: "Tokens expiring soon",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    fields: [{ key: "days", label: "Days before expiry", type: "number", default: 7, min: 1 }],
    summary: (c) => `${n(c, "days", 7)} days before a customer's tokens expire`,
    description:
      "Checked daily. Sends the chosen number of days before any of the customer's tokens expire. Use for urgency-driven rebooking.",
  },
  {
    id: "credit_expiring",
    label: "Gift card credit expiring soon",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    fields: [{ key: "days", label: "Days before expiry", type: "number", default: 30, min: 1 }],
    summary: (c) => `${n(c, "days", 30)} days before gift card credit expires`,
    description:
      "Checked daily. Sends the chosen number of days before unredeemed gift card credit expires. Use to remind recipients to book.",
  },
  {
    id: "credit_unspent",
    label: "Credit left unspent",
    group: "Intro offer, tokens & credit",
    kind: "sweep",
    fields: [{ key: "days", label: "Days since redeeming", type: "number", default: 30, min: 1 }],
    summary: (c) => `${n(c, "days", 30)} days after redeeming, with credit still unspent`,
    description:
      "Checked daily. Sends if a customer still has gift card credit left the chosen number of days after redeeming it. Use to prompt a booking.",
  },

  // ---------------- Gift cards ----------------
  {
    id: "gift_card_purchased",
    label: "Gift card purchased",
    group: "Gift cards",
    kind: "event",
    summary: () => "When a customer buys a gift card (sent to the purchaser)",
    description:
      "Fires when a gift card is purchased. The email is sent to the purchaser, not the recipient, so use it as a thank-you.",
  },
  {
    id: "gift_card_redeemed",
    label: "Gift card redeemed",
    group: "Gift cards",
    kind: "event",
    summary: () => "When a gift card is redeemed",
    description:
      "Fires when a gift card is redeemed. Use to welcome the recipient and explain how to use their credit.",
  },
  {
    id: "gift_card_unredeemed",
    label: "Gift card not redeemed",
    group: "Gift cards",
    kind: "sweep",
    fields: [{ key: "days", label: "Days since purchase", type: "number", default: 30, min: 1 }],
    summary: (c) => `${n(c, "days", 30)} days after purchase with the gift card still unredeemed`,
    description:
      "Checked daily. Sends to the recipient if the gift card has not been redeemed after the chosen number of days. Use as a gentle nudge.",
  },

  // ---------------- Spend & value ----------------
  {
    id: "lifetime_spend_over",
    label: "Lifetime spend passes an amount",
    group: "Spend & value",
    kind: "sweep",
    fields: [{ key: "amount", label: "Amount", type: "amount", default: 250, min: 1 }],
    summary: (c) => `When a customer's total spend passes £${n(c, "amount", 250)}`,
    description:
      "Checked daily. Sends once a customer's lifetime spend crosses the chosen amount. Use for VIP rewards or thank-yous.",
  },
  {
    id: "nth_purchase",
    label: "Nth purchase of any type",
    group: "Spend & value",
    kind: "sweep",
    fields: [{ key: "count", label: "Purchase number", type: "number", default: 5, min: 1 }],
    summary: (c) => `On a customer's purchase number ${n(c, "count", 5)}`,
    description:
      "Checked daily. Counts any paid purchase (booking, membership, gift card, intro offer) and sends at the chosen purchase number.",
  },
  {
    id: "single_purchase_over",
    label: "Single purchase over an amount",
    group: "Spend & value",
    kind: "event",
    fields: [{ key: "amount", label: "Amount", type: "amount", default: 75, min: 1 }],
    summary: (c) => `When a single purchase is more than £${n(c, "amount", 75)}`,
    description:
      "Fires immediately when a single transaction exceeds the chosen amount. Use for high-value thank-yous or upsells.",
  },

  // ---------------- Lifecycle ----------------
  {
    id: "account_created",
    label: "Account created",
    group: "Lifecycle",
    kind: "event",
    summary: () => "When someone creates an account",
    description:
      "Fires when a new account is created. Use for a welcome email with a booking CTA.",
  },
  {
    id: "first_visit_anniversary",
    label: "Anniversary of first visit",
    group: "Lifecycle",
    kind: "sweep",
    summary: () => "Each year on the anniversary of a customer's first visit",
    description:
      "Checked daily. Sends once per year on the anniversary of a customer's first paid session. Use for birthday-style loyalty emails.",
  },
  {
    id: "customer_tagged",
    label: "Customer given a tag in admin",
    group: "Lifecycle",
    kind: "sweep",
    fields: [{ key: "tag", label: "Tag", type: "text", default: "vip" }],
    summary: (c) => `When a customer is tagged "${c?.tag || "vip"}" in admin`,
    description:
      "Checked daily. Sends when an admin adds the chosen tag to a customer profile. Use for VIP onboarding or segmented campaigns.",
  },
  {
    id: "contact_message_resolved",
    label: "Contact message resolved",
    group: "Lifecycle",
    kind: "event",
    summary: () => "When a contact form message is marked as resolved",
    description:
      "Fires when a contact message is marked as resolved. Use to request feedback or offer a follow-up booking.",
  },
  {
    id: "manual",
    label: "Manual only (run on demand)",
    group: "Lifecycle",
    kind: "manual",
    summary: () => "Only sent when you run the rule manually",
    description:
      "Never fires automatically. Use for one-off campaigns or backfills where you choose the recipients yourself.",
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
