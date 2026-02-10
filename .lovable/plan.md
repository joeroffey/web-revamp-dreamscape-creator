

# Contact Messages System

## What This Does
When someone fills out the contact form on your website, three things will happen:
1. **You get an email** at info@revitalisehub.co.uk with their message
2. **The message is saved** to a new "Messages" section in your admin panel
3. **You can reply directly from admin** -- the reply is sent as a branded email using your logo, colours, and contact details

---

## How It Works

1. **New database table** -- `contact_messages` stores every submission (name, email, phone, message, read/replied status, and any admin reply)

2. **New edge function: `send-contact-notification`** -- When someone submits the contact form, this function:
   - Saves the message to the database
   - Sends a notification email to info@revitalisehub.co.uk with the customer's details

3. **New edge function: `send-contact-reply`** -- When an admin replies from the admin panel, this function sends a branded email to the customer using the same template style as your booking/membership confirmations (logo, colours, footer with address). The admin's reply text preserves paragraph formatting.

4. **Updated contact form** -- The form will call the new edge function instead of simulating a submission

5. **New admin page: `/admin/messages`** -- Shows all contact messages in a list with:
   - Unread/read indicators
   - Customer name, email, date
   - Click to view full message
   - Reply button that opens a text area to compose a response
   - Status badges (New, Read, Replied)

6. **Admin navigation updated** -- A "Messages" link added to both desktop and mobile admin nav

---

## Technical Details

### Database Migration
```sql
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',  -- new, read, replied
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: only admins can read/write
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact messages"
  ON public.contact_messages FOR ALL
  USING (public.is_admin(auth.uid()));

-- Update trigger
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### Edge Functions
- **`send-contact-notification`** -- Receives form data, inserts into `contact_messages`, emails info@revitalisehub.co.uk
- **`send-contact-reply`** -- Receives message ID + reply text, updates the record, sends branded email to customer (converts newlines to `<p>` tags for proper paragraph formatting)

### Files to Create
- `supabase/functions/send-contact-notification/index.ts`
- `supabase/functions/send-contact-reply/index.ts`
- `src/components/admin/ModernMessageManagement.tsx` -- admin messages page

### Files to Modify
- `src/components/ContactSection.tsx` -- call the edge function instead of simulating
- `src/App.tsx` -- add `/admin/messages` route
- `src/components/AdminNavigation.tsx` -- add Messages nav item
- `src/components/MobileAdminNav.tsx` -- add Messages nav item

