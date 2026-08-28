# Auto-create accounts for admin-created customers

When an admin adds a customer in the admin portal, the customer currently only lands in the CRM table — no login account is created. This adds automatic account creation plus a "set your password" email.

## What will happen

1. Admin fills in the Create Customer form (name, email, phone, notes, tags) and saves.
2. The customer record is saved to the CRM as it is today.
3. A login account is created immediately in Supabase with a random unusable password, email already confirmed, and the name/phone attached so the profile record is created by the existing signup trigger.
4. The customer is emailed a branded "Set your password" link (Revitalise Hub styling, same look as the existing bulk password email, but with welcome wording instead of the website-migration wording). The link points to /reset-password.
5. Once they set a password they can sign in and see their bookings, memberships and tokens.
6. If an account with that email already exists, the account creation step is skipped silently and no email is sent — the CRM record is still saved. Admin sees a note in the success toast.
7. Editing an existing customer does not create accounts or send emails.

Admin feedback: the success toast will say one of
- "Customer created — account set up and password email sent"
- "Customer created — account already existed"
- "Customer created — but account/email failed" (CRM save still succeeds so the admin never loses data)

There will also be a "Resend password setup email" action on the customer row so admins can re-trigger it if the customer never received or lost the email.

## Technical approach

- New edge function `provision-customer-account`:
  - Requires an admin caller via the existing `_shared/adminAuth.ts` `requireAdmin` helper.
  - Input: `{ email, full_name, phone, sendEmail }`.
  - Uses the service-role client: `auth.admin.listUsers`/lookup by email to check existence; `auth.admin.createUser` with `email_confirm: true` and `user_metadata: { full_name, phone }`.
  - Generates a recovery link with `auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: 'https://www.revitalisehub.co.uk/reset-password' } })` and sends it with Resend from `Revitalise Hub <noreply@revitalisehub.co.uk>` — same pattern and branding as `send-bulk-password-reset`.
  - Returns `{ created, alreadyExisted, emailSent, error }` so the UI can report accurately.
- `src/components/admin/ModernCustomerManagement.tsx`: after a successful `create` insert in `saveCustomer`, invoke the new function and surface the result in the toast. Failures of the provisioning step do not roll back or block the CRM insert.
- Add the resend action to the customer row menu, calling the same function with `sendEmail: true`.
- No database schema changes required; existing `handle_new_user` trigger already populates `profiles` and upserts `customers`, and `link_orphan_memberships` will link any pre-existing memberships to the new account.
- Existing secrets (`RESEND_API_KEY`, service role) are already configured — nothing new needed.
