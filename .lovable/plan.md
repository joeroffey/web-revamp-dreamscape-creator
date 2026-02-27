

## Mailchimp Integration Plan

### What You'll Need

You'll need two things from your Mailchimp account:
1. **Mailchimp API Key** -- found in Account Settings > API Keys
2. **Mailchimp Audience (List) ID** -- found in Audience > Settings > Audience name and defaults

You'll also need to know your **Mailchimp data center** (the suffix on your API key, e.g. `us21`).

### Architecture

A single new edge function `sync-to-mailchimp` will accept a name + email and upsert the contact into your Mailchimp audience. It will be called from every checkout flow as a fire-and-forget call (failures won't block bookings).

### Changes

#### 1. New edge function: `supabase/functions/sync-to-mailchimp/index.ts`
- Accepts `{ email, firstName, lastName }` via POST
- Uses Mailchimp Marketing API (`PUT /lists/{listId}/members/{subscriberHash}`) to add or update the contact
- Uses MD5 hash of lowercase email as subscriber hash (Mailchimp requirement)
- Sets status to `subscribed` for new contacts, preserves existing status for updates (`status_if_new`)
- Reads `MAILCHIMP_API_KEY`, `MAILCHIMP_LIST_ID`, `MAILCHIMP_SERVER_PREFIX` from secrets

#### 2. Add to `supabase/config.toml`
- `[functions.sync-to-mailchimp]` with `verify_jwt = false`

#### 3. Update `supabase/functions/stripe-webhook/index.ts`
- After each successful checkout (booking, partial credit booking, member booking with guests, gift card, membership subscription, membership one-time, intro offer), fire a call to `sync-to-mailchimp` with the customer's name and email
- Single helper function at the top to avoid repetition

#### 4. Update `supabase/functions/create-member-booking/index.ts`
- Add the same `sync-to-mailchimp` call after successful free membership booking

#### 5. Check other free checkout flows
- `create-credit-booking` and `create-token-booking` -- add the same call

#### 6. Store 3 new secrets
- `MAILCHIMP_API_KEY`
- `MAILCHIMP_LIST_ID`
- `MAILCHIMP_SERVER_PREFIX` (e.g. `us21`)

### Checkout Flows Covered

| Flow | Where triggered |
|---|---|
| Standard booking (card) | stripe-webhook (type: booking) |
| Partial credit booking | stripe-webhook (type: partial_credit_booking) |
| Member + paying guests | stripe-webhook (type: member_booking_with_guests) |
| Gift card purchase | stripe-webhook (type: gift_card) |
| Membership (subscription) | stripe-webhook (subscription mode) |
| Membership (one-time) | stripe-webhook (type: membership_onetime) |
| Intro offer | stripe-webhook (type: intro_offer) |
| Free member booking | create-member-booking |
| Full credit booking | create-credit-booking |
| Token booking | create-token-booking |

### What Customers Experience

Nothing changes. The Mailchimp sync happens silently in the background after checkout. If Mailchimp is down or misconfigured, bookings still work normally.

