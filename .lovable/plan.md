

# Plan: Fix Three Critical Issues

## Issues Identified

### Issue 1: Disappearing Bookings
**Root Cause**: Bookings are not disappearing from the database - they exist but remain in `payment_status: 'pending'` status because:
1. The customer starts a booking, creates a "pending" record
2. The customer either abandons checkout OR completes payment but the Stripe webhook fails to confirm
3. The `confirm_booking` function in the webhook only updates status when called successfully

The bookings ARE stored - I found 18+ pending bookings in the database. The issue is that:
- Pending bookings may not be prominently visible in admin
- If webhook fails, paid bookings stay as "pending"
- There's no cleanup or alerting for abandoned pending bookings

### Issue 2: Membership Purchase Errors (Popup Blocked)
**Root Cause**: In `src/pages/Memberships.tsx` line 125, the code uses:
```javascript
window.open(data.url, '_blank');
```
This opens a new tab which Safari/Mac blocks as a popup. The intro offer on line 279 correctly uses `window.location.href` but the main membership subscription flow does not.

### Issue 3: Gift Card Popup Being Blocked on Mac
**Status**: The code in `src/pages/GiftCards.tsx` already uses `window.location.href` correctly (line 91). However, if users are still experiencing this, it could be:
- Browser caching an old version
- An edge case in async timing on Safari

---

## Solution Plan

### Fix 1: Membership Redirect (Popup Issue)
**File**: `src/pages/Memberships.tsx`

Change line 125 from:
```javascript
window.open(data.url, '_blank');
```
To:
```javascript
window.location.href = data.url;
```

This ensures the same-tab navigation that works for gift cards and intro offers.

### Fix 2: Improve Booking Visibility in Admin
**File**: `src/components/admin/ModernBookingManagement.tsx`

Add visual distinction and alerts for pending bookings:
1. Add a prominent warning banner when there are recent pending bookings with Stripe sessions (potential payment issues)
2. Add a "Pending" filter option that's more visible
3. Color-code pending bookings more prominently in the list
4. Add a note explaining that pending bookings are awaiting payment

### Fix 3: Add Booking Reliability Safeguards
Create additional safeguards:

1. **Add webhook retry/verification**: Create an admin button to manually re-check Stripe session status for pending bookings
2. **Pending booking alerts**: Show a count of pending bookings in the dashboard stats
3. **Audit logging**: Ensure booking creation and status changes are logged for debugging

---

## Technical Details

### Changes to `src/pages/Memberships.tsx`
- Line 125: Replace `window.open(data.url, '_blank')` with `window.location.href = data.url`

### Changes to `src/components/admin/ModernBookingManagement.tsx`
1. Add a warning banner component that appears when there are pending bookings with Stripe session IDs (possible webhook failures)
2. Add "Pending Payments" as a highlighted filter option
3. Add tooltips explaining payment statuses
4. Add a "Verify Payment" button for pending bookings that have stripe_session_id

### New Edge Function: `verify-booking-payment`
Create a function that:
- Takes a booking ID
- Fetches the Stripe session by its ID
- If payment is complete, calls `confirm_booking` to update status
- Returns the result

This allows admins to manually verify and fix bookings where the webhook may have failed.

---

## Benefits

1. **Membership purchases work on Safari/Mac** - no popup blocking
2. **All bookings remain visible** - pending bookings shown prominently with clear status
3. **Recovery mechanism** - admins can verify and fix stuck bookings
4. **Better visibility** - dashboard shows pending booking count as a warning

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Memberships.tsx` | Fix Stripe redirect to use `window.location.href` |
| `src/components/admin/ModernBookingManagement.tsx` | Add pending booking warnings and verify payment functionality |
| `supabase/functions/verify-booking-payment/index.ts` | New function to manually verify Stripe payment status |

