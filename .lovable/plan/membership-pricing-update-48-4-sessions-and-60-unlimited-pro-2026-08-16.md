# Membership pricing update: £48 (4 sessions) and £60 unlimited promo

## What changes for customers

The memberships page will show two plans only:

- **4 Sessions Per Month — £48/month** (unchanged price)
- **Unlimited — £60/month**, displayed with £100 struck through and a "Promotion" badge

The 8-sessions-per-month £75 plan is removed from the site. The two customers currently on it keep their existing £75 subscriptions running untouched.

The 9 active unlimited members currently billing £100/month will be moved to £60/month, effective from their next renewal (no mid-cycle charge or credit).

## Site changes

- `src/pages/Memberships.tsx`: remove the `8_sessions_month` plan from `membershipPlans`; set unlimited to £60 with an `originalPrice: 100` and `promo: true` flag; mark unlimited as the highlighted plan. Card rendering shows struck-through £100 next to £60 plus a "Promotion" badge, and keeps working with the existing promo-code discount display (discount applies to the £60 price).
- `src/components/admin/CreateMembershipDialog.tsx`: options become 4 sessions (£48) and Unlimited (£60); the 8-session option is removed from new-membership creation.
- Existing type labels for `8_sessions_month` stay in `src/pages/admin/Memberships.tsx`, `src/pages/Dashboard.tsx` and `MembershipSuccess.tsx` so legacy members still display correctly.

## Backend / Stripe changes

- `supabase/functions/create-membership-payment/index.ts`: `unlimited` price becomes 6000 pence; `8_sessions_month` moves to the legacy block (kept so any in-flight session or webhook replay still resolves, but no longer offered in the UI).
- `supabase/functions/create-admin-membership-payment/index.ts`: same price update for `unlimited` (6000).
- Checkout uses inline `price_data`, so no Stripe dashboard product/price setup is needed for new signups — the new amounts apply immediately after deploy.

### Migrating the 9 existing unlimited subscriptions

A one-off admin-only edge function (`migrate-unlimited-price`) that:

1. Requires an authenticated admin (same `user_roles` check pattern used by the other admin functions).
2. Creates (or reuses) a Stripe recurring price of £60/month GBP for an "Unlimited Membership" product.
3. Loads active memberships where `membership_type = 'unlimited'` and `stripe_subscription_id` is set, and for each: retrieves the subscription and updates its single item to the new price with `proration_behavior: 'none'` so the change lands at the next renewal.
4. Updates `memberships.price_amount = 6000` for those rows.
5. Returns a per-subscription success/failure report; failures are logged and skipped, never left half-applied for that row.

I will run it once from the admin session after deploy and report the results back. Nothing is charged immediately.

## Verification

- Load `/memberships` in the preview and confirm two plans, the struck-through £100/£60 promo display, and that promo-code entry still recalculates from £60.
- Confirm the admin create-membership dialog shows only the two plans at the right prices.
- Confirm the two legacy £75 members and any cancelled records still render with correct labels in `/admin/memberships` and the customer dashboard.
- After running the migration function, re-query the memberships table and spot-check one Stripe subscription shows the £60 price scheduled.

## Not changing

- Session allowances (4 per month; unlimited = 999), booking/token logic, membership discount percentages.
- Any refunds, mid-cycle charges, or cancellations for existing members.
