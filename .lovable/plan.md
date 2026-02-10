

# Membership Booking Improvements

## What Changes

### 1. Price display for membership bookings
Membership bookings (where `final_amount` is 0 and the booking was made via membership) will show **"£0.00 (Membership)"** instead of the misleading "£18.00" in the admin schedule and booking views. The system already stores `final_amount = 0` for membership bookings -- the display just needs to use `final_amount` instead of `price_amount`.

### 2. New "Membership" tag replacing "Manual"
Currently, bookings without a `stripe_session_id` show a "Manual" badge. Membership bookings (identifiable by `final_amount = 0` with no `stripe_session_id`) will instead show a **green "Membership"** badge. The logic will be:
- Has `stripe_session_id` --> "Stripe" (blue badge)
- `final_amount === 0` and no `stripe_session_id` --> "Membership" (green badge)
- No `stripe_session_id` and `final_amount > 0` or standard manual --> "Manual" (amber badge)

### 3. Admin can book using a customer's membership credits
The `EnhancedCreateBookingDialog` will be updated to:
- Check if the selected customer has an active membership (query `memberships` table by email)
- If they do, show a "Use Membership Credit" option (similar to the existing token toggle)
- Display sessions remaining
- When toggled on: set `final_amount = 0`, `payment_status = 'paid'`, guest count locked to 1, service type locked to communal
- On submit: decrement `sessions_remaining` on the membership record

---

## Technical Details

### Files to modify

**`src/components/admin/DailyScheduleView.tsx`**
- Line 209: Change price display from `price_amount` to use `final_amount` when available (show "£0.00 (Membership)" for membership bookings)
- Lines 179-187: Add "Membership" badge logic -- if `final_amount === 0` and no `stripe_session_id`, show green "Membership" badge instead of amber "Manual"

**`src/components/admin/ModernBookingManagement.tsx`**
- Same badge logic update (around line 490)
- Revenue calculations should use `final_amount` where available

**`src/components/admin/BookingDetailsDialog.tsx`**
- Update price display to show `final_amount` and indicate membership usage

**`src/components/admin/EnhancedCreateBookingDialog.tsx`**
- Add membership lookup query (by `customer_email`, status `active`, `end_date >= today`)
- Add state for `useMembership` toggle and membership data
- Show "Use Membership Credit" card (similar to token card) with sessions remaining count
- When membership toggle is on:
  - Lock service type to "Communal Session"
  - Lock guest count to 1
  - Set `final_amount = 0`, `payment_status = 'paid'`
  - Add `[Membership booking]` to special_requests
- On successful booking: decrement `sessions_remaining` on the membership record
- Membership option should be mutually exclusive with token payment

