

# Fix: Only tag bookings as "Membership" when explicitly marked

## Problem
The current detection logic has a fallback condition: if `final_amount === 0` and `price_amount > 0` and no `stripe_session_id`, it assumes the booking is a membership booking. However, this also matches manually-created bookings where the admin simply didn't charge the customer. Gregory Davies' booking is one such case -- it has no `[Membership booking]` tag, so it's not actually a membership booking.

## Solution
Remove the broad `final_amount === 0` fallback from the membership detection logic. Only identify a booking as "Membership" if `special_requests` explicitly contains `[Membership booking]`. This tag is added by:
- The `create-member-booking` edge function (customer self-service)
- The `EnhancedCreateBookingDialog` (admin membership booking)

Any booking without this tag will fall through to "Manual" (or "Token" / "Stripe" as appropriate).

## Files to update

**`src/components/admin/DailyScheduleView.tsx`** (line 183)
- Change condition from `(booking.special_requests?.includes('[Membership booking]') || (booking.final_amount === 0 && (booking.price_amount ?? 0) > 0 && !booking.stripe_session_id))` to just `booking.special_requests?.includes('[Membership booking]')`
- Same change for the price display (around line 209)

**`src/components/admin/ModernBookingManagement.tsx`**
- Update the `isMembershipBooking` helper to only check for the `[Membership booking]` tag

**`src/components/admin/BookingDetailsDialog.tsx`**
- Same condition update for badge and price display

All three files get the same simple change: remove the `final_amount === 0` fallback, rely solely on the `[Membership booking]` string tag.

