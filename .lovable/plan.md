
# Self-Service Booking Management

Allow signed-in users to cancel or reschedule their own upcoming bookings from the Dashboard. Cancellations free the slot for the public; refunds are issued as credit, a session, or a token — never as cash.

Because the site is live, all changes are additive (new edge functions + new UI on the dashboard). No existing booking, payment, or webhook code is altered.

---

## 1. New edge function: `user-cancel-booking`

Auth required (validate JWT via `getUser`). Verifies the booking belongs to the caller, is in the future, and is not already cancelled.

Determines refund type by inspecting the booking row:

| Source | Detector | Refund action |
|---|---|---|
| Membership | `special_requests` contains `[Membership booking]` | `memberships.sessions_remaining += 1` (skip if unlimited or membership ended) |
| Token (manual or intro) | `discount_amount > 0`, `final_amount = 0`, no membership tag | `customer_tokens.tokens_remaining += 1` (mirrors existing `cancel-booking` logic) |
| Credit booking (full or partial) | `special_requests` contains `[Credit booking]` / `[Partial credit]` | Add credited amount to `customer_credits.credit_balance` |
| Paid (Stripe card / cash) | `final_amount > 0` and not credit/token | Add `final_amount` to `customer_credits.credit_balance` (1-year expiry, matching gift-card credit policy) |

Then:
- Set `payment_status = 'cancelled'`, update `updated_at`.
- Decrement `time_slots.booked_count` by `guest_count` (clamped ≥ 0); set `is_available = true` if below capacity. Private booking → fully reset (`booked_count = 0`, `is_available = true`).
- Send a cancellation email via Resend (reuse existing email infra) summarising the refund type.

Credit-source bookings will be tagged going forward by appending `[Credit booking]` / `[Partial credit]` in `create-credit-booking` and `create-partial-credit-booking` (mirrors the existing `[Membership booking]` pattern — small, safe addition).

## 2. New edge function: `user-reschedule-booking`

Auth required. Inputs: `bookingId`, `newTimeSlotId`.

Steps:
1. Load booking; verify ownership, not cancelled, not in the past.
2. Load new time slot live and apply the same capacity rules as `confirm_booking`:
   - Communal: no private booking on slot AND `current_communal + guest_count <= 5`.
   - Private: slot has zero existing bookings.
3. In a single sequence:
   - Free old slot (decrement `booked_count` by `guest_count`, clamp, recompute `is_available`).
   - Increment new slot's `booked_count` by `guest_count`; recompute `is_available`.
   - Update booking row: `time_slot_id`, `session_date`, `session_time`, `updated_at`.
4. Send an "updated booking" email with the new date/time.

If validation fails, return a clear error and make no changes.

## 3. Dashboard UI changes (`src/pages/Dashboard.tsx`)

For each booking that is **upcoming** (`session_date >= today`) and `payment_status = 'paid'`:

- Add **Reschedule** and **Cancel** buttons.
- **Cancel**: opens an `AlertDialog` explaining the refund type (computed client-side from the same rules) and the no-cash policy. On confirm → calls `user-cancel-booking`, refreshes list, toasts result.
- **Reschedule**: opens a `Dialog` containing the existing public `TimeSlotPicker` component (reused as-is, so timezone-safe date logic carries over). Picker is locked to the booking's `booking_type` and `guest_count`. On selection → calls `user-reschedule-booking`, refreshes list, toasts result.

Past bookings remain read-only.

Also display the user's current **credit balance** on the Dashboard so they can see refunds land.

## 4. Cancellation cutoff

**None.** Users can cancel or reschedule any future booking right up to (and including) the slot's start time. No time-based restriction in the edge functions or UI.

## 5. Safety / non-regression

- No changes to: Stripe webhook, `confirm_booking` SQL function, public booking flow, admin dialogs, gift-card / membership purchase flows.
- Existing admin `cancel-booking` edge function is left in place; the new `user-cancel-booking` is a separate function with auth + ownership checks so the live admin flow keeps working unchanged.
- Capacity updates use the same `booked_count` + `is_available` pattern already used elsewhere.
- Timezone-safe date handling is preserved by reusing `TimeSlotPicker` and storing `session_date` from the slot row (not from `new Date(...).toISOString()`).

## 6. Files affected

New:
- `supabase/functions/user-cancel-booking/index.ts`
- `supabase/functions/user-reschedule-booking/index.ts`
- `supabase/config.toml` — register both functions (JWT validated in code)

Modified (small, additive):
- `src/pages/Dashboard.tsx` — Reschedule/Cancel buttons, dialogs, credit balance display
- `supabase/functions/create-credit-booking/index.ts` — append `[Credit booking]` tag in `special_requests`
- `supabase/functions/create-partial-credit-booking/index.ts` — append `[Partial credit]` tag

No database schema or migration changes are required.
