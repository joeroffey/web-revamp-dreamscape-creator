# Conditional Emails (Mailchimp) — Admin Feature

Admin designs an email template in Mailchimp, then in the admin portal builds a rule such as "after a customer's 3rd paid session, send template *Loyalty Reward*". When a customer meets that condition, the email is sent through Mailchimp to that customer, they are tagged in the audience, and if they aren't in the audience yet they are added automatically from their profile.

## How sending works

You keep making templates in Mailchimp and sending through Mailchimp. To send a template to one specific customer, we use the Mailchimp Marketing API to create a one-recipient campaign from the chosen template and send it. That means:

- Templates stay in Mailchimp, and each send appears in Mailchimp reporting.
- Sends are queued and processed a few at a time (Mailchimp rate limits), so delivery is typically within a minute or two of the trigger.
- Every campaign created this way is named with the rule and customer so the campaign list stays readable (e.g. `[CE] Loyalty Reward — joe@example.com — 2026-08-20`).

If you later add the Mailchimp Transactional (Mandrill) add-on, we can switch the send step to true 1-to-1 transactional sending without changing any of the rules or admin UI. Worth revisiting if volume grows.

## Admin experience

New admin page: **Admin → Conditional Emails**

1. **Rules list** — name, template, condition summary, on/off toggle, sends in last 30 days, last triggered.
2. **Create/edit rule** dialog:
   - **Template**: dropdown loaded live from your Mailchimp account (name + last edited), with a "Preview" link.
   - **Subject line** and **from name** (defaults pulled from the template/audience).
   - **Condition builder**: pick a trigger type, then fill in its simple inputs (a number, a number of days, an amount). Plain-English preview of the rule is shown as you build it, e.g. "When a customer has completed 3 paid sessions".
   - **Extra filters** (optional, combinable): membership status (any / member / non-member), has an active intro offer or tokens, customer tag, first-time vs returning, minimum lifetime spend.
   - **Delay**: send immediately, or after N hours/days.
   - **Repeat policy**: once per customer ever / once per rule per customer per N days / every time the condition occurs.
   - **Quiet hours**: hold sends until between 08:00–20:00 local time (optional).
   - **Mailchimp tag**: tag to apply to the customer when the rule fires (pre-filled from rule name, editable).
3. **Test send** button — sends the rule's email to an address you type, so you can check it before enabling.
4. **Activity log** — every trigger: customer, rule, template, status (queued / sent / failed / skipped-duplicate), Mailchimp campaign link, error text if failed.

## Conditions available

**Booking / session based**
- Nth completed paid session (any N) — loyalty milestones
- First ever booking made
- First session completed
- Booked a private session (or a communal session) for the first time
- Booked with guests (guest count ≥ N)
- Booking created (immediate "see you soon" email)
- Upcoming session reminder — N days/hours before the session
- Post-session follow-up — N hours/days after a completed session
- No-show / cancelled by customer
- Booking cancelled or refunded
- Rescheduled a booking

**Lapsed / re-engagement**
- Hasn't booked in N days (win-back)
- Was a regular (≥ N sessions) but nothing in N days
- Never booked after creating an account, N days later
- Abandoned checkout: booking left pending/unpaid for N hours

**Membership based**
- Membership started (welcome)
- Membership renewed (Nth renewal, e.g. 3-month or 12-month loyalty)
- Membership cancelled
- Membership expiring in N days
- Membership sessions nearly used up in the current period (≤ N remaining)
- Member hasn't used any sessions this billing period, N days in
- Upgraded or downgraded plan

**Intro offer / tokens / credit**
- Purchased the intro offer
- Intro offer tokens: N remaining
- Intro offer fully used (conversion push to membership)
- Intro offer unused after N days
- Tokens expiring in N days
- Gift card credit expiring in N days
- Credit balance left unspent after N days

**Gift cards**
- Purchased a gift card (thank-you to purchaser)
- Gift card redeemed
- Gift card not redeemed after N days (nudge the recipient)

**Spend / value**
- Lifetime spend crosses £X
- Nth purchase of any type
- Single purchase over £X

**Lifecycle / other**
- Account created (welcome)
- Anniversary of first visit (yearly)
- Customer tagged with X in admin
- Contact form message resolved (feedback request)
- Manual trigger: run a rule now against a chosen customer or segment (useful for one-off sends and for backfills)

Each rule is one trigger plus optional filters, so you can build precise things like "3rd completed session AND not a member → send Membership Offer, once per customer".

## Linking to the customer's Mailchimp record

- Match is by lowercased email (same approach as the existing Mailchimp sync).
- Before any send, the customer is upserted into the audience with first/last name from their profile, so a customer who isn't in Mailchimp yet is added automatically rather than the send failing.
- The rule's tag is applied on send, so you can also build Mailchimp audiences, segments and Journeys off the same conditions.
- Unsubscribed customers are skipped and logged as "skipped — unsubscribed" (Mailchimp will not send to them, and we won't re-subscribe them).

## Safety rails

- Rules are **off** by default; you enable after a test send.
- Deduplication per (rule, customer, occurrence) so Stripe/webhook retries and repeated sweeps can't double-send.
- Global caps: max sends per rule per day and max total per day, configurable, to stop a misconfigured rule spamming.
- Failed sends are retried with backoff, then marked failed with the Mailchimp error visible in the log.

## Technical notes

**Database (new tables, all admin-only via RLS + `has_role`)**
- `conditional_email_rules` — name, mailchimp_template_id, template_name, subject, from_name, trigger_type, trigger_config jsonb, filters jsonb, delay_minutes, repeat_policy, repeat_window_days, tag, quiet_hours, daily_cap, is_active, timestamps.
- `conditional_email_sends` — rule_id, customer_email, user_id, occurrence_key (unique with rule_id for dedupe), status, scheduled_for, sent_at, mailchimp_campaign_id, error, payload jsonb.
- `conditional_email_settings` — global daily cap, quiet-hours default, kill switch.

**Edge functions**
- `mailchimp-templates` (admin-only) — lists templates from the Marketing API for the dropdown.
- `conditional-emails-evaluate` (admin-only + service-role) — evaluates rules for a given event or for the whole customer base; writes queued rows into `conditional_email_sends`. Called from event points and from the scheduled sweep.
- `conditional-emails-dispatch` (service-role) — picks due queued rows, upserts the member into the audience, applies the tag, creates the one-recipient campaign from the template, sets content, sends, records the campaign id. Rate-limited, small batches, backoff on failure.
- `conditional-emails-test-send` (admin-only) — one-off send to a typed address.

**Event hooks (instant triggers)** — add non-blocking evaluate calls at existing fulfilment points: `stripe-webhook` (booking paid, membership created/renewed/cancelled, gift card paid, intro offer), `user-cancel-booking`, `user-reschedule-booking`, `process-refund`, `redeem-gift-card`, and signup. Failures there are logged and never block the payment/booking path.

**Scheduling** — `pg_cron` job every 5 minutes hits `conditional-emails-dispatch` (drain the queue), plus a daily job hitting `conditional-emails-evaluate` in sweep mode for time-based conditions (lapsed, expiring, anniversaries, reminders).

**Admin UI** — `src/pages/admin/ConditionalEmails.tsx` plus a `ConditionalEmailRuleDialog`, added to `AdminSidebar` under Content. Trigger definitions live in one shared config file (`src/lib/conditionalEmailTriggers.ts`) that drives both the builder inputs and the plain-English summary, so adding a new condition later is a single entry.

## Suggested build order

1. Tables, RLS, template-list function, admin page with rule CRUD and template dropdown (no sending yet).
2. Dispatch function + audience upsert + tagging + test send; verify one real send end-to-end.
3. Event-based triggers wired into existing webhooks and booking functions.
4. Scheduled sweep for time-based triggers, then caps, retries and the activity log polish.
