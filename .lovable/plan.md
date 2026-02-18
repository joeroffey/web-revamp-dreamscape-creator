
## Fix: Email Change Not Working Due to User Pagination

### Root Cause

The Supabase `auth.admin.listUsers()` call returns only the **first 50 users** by default. Your project has **904 auth users**, so the target user is almost never found in the results. The function falls into the "no auth account found" branch and only updates the `customers` table, leaving the auth email unchanged.

### The Fix

**File: `supabase/functions/update-customer-email/index.ts`**

Replace the `listUsers()` approach with paginated fetching that retrieves ALL users, or better yet, use a targeted lookup approach:

1. **Find the auth user by email** -- Instead of listing all users and filtering, paginate through `listUsers()` until the target user is found, or use multiple pages. The most reliable approach is to loop through pages of 1000 users each until all are fetched.

2. **Check for email conflicts** using the same full user list.

3. The rest of the logic (collision check, auth update, DB updates) stays the same.

### Immediate Data Fix

The customer record is currently mismatched (customers table says `jazzybearr99@gmail.com` but auth still says `josephh.roffey@gmail.com`). After deploying the fix, re-run the email change from admin to sync them, or revert the customer record back to `josephh.roffey@gmail.com` first.

### Technical Detail

Replace:
```typescript
const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
```

With a loop that fetches all pages:
```typescript
let allUsers = [];
let page = 1;
const perPage = 1000;
while (true) {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
  if (error) throw error;
  allUsers.push(...users);
  if (users.length < perPage) break;
  page++;
}
```

Then use `allUsers` for both the current email lookup and the conflict check.

### Summary

| File | Change |
|---|---|
| `supabase/functions/update-customer-email/index.ts` | Replace single `listUsers()` call with paginated fetch to cover all 904+ users |
