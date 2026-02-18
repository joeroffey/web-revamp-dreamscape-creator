

## Fix: Email Change Collision Detection

### The Problem

The edge function doesn't check whether the new email already belongs to another Supabase Auth user. When it does, the `updateUserById` call fails, but the function continues to update database tables anyway -- leaving things in an inconsistent state.

### Changes

**File: `supabase/functions/update-customer-email/index.ts`**

1. After finding the auth user for the current email, check if the new email already belongs to a **different** auth user. If it does, return an error: "This email is already associated with another account."

2. Only proceed with database table updates (customers, bookings, memberships, tokens, credits) **after** confirming the auth email update succeeded -- not before or independently.

3. Properly check the error response from `updateUserById` and return it clearly to the admin UI.

### No other files need changes

The admin UI dialog already displays error messages from the edge function response, so the new error will surface automatically.

### Summary

| File | Change |
|---|---|
| `supabase/functions/update-customer-email/index.ts` | Add duplicate email check before auth update; only update DB tables after auth succeeds |

