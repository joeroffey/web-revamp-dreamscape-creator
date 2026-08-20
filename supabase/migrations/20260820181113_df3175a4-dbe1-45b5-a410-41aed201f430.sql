-- 1. Fix mutable search_path on all public functions
ALTER FUNCTION public.confirm_booking(uuid, text) SET search_path = public;
ALTER FUNCTION public.expire_old_memberships() SET search_path = public;
ALTER FUNCTION public.generate_time_slots(date, date) SET search_path = public;
ALTER FUNCTION public.get_available_communal_spaces(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.log_admin_action() SET search_path = public;
ALTER FUNCTION public.reset_weekly_sessions() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 2. Remove client access to internal / privileged functions
REVOKE EXECUTE ON FUNCTION public.expire_old_memberships() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_weekly_sessions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_admin_action() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_orphan_memberships() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_booking(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;

-- 3. audit_logs: only server-side (service role / trigger owner) writes
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. bookings
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow updates for payment processing" ON public.bookings;

CREATE POLICY "Admins can insert bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users and admins can update bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
    OR lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
    OR lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- 5. contact_messages: inserts happen through the edge function (service role)
DROP POLICY IF EXISTS "Service can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 6. customer_credits
DROP POLICY IF EXISTS "Service can insert credits" ON public.customer_credits;
DROP POLICY IF EXISTS "Service can update credits" ON public.customer_credits;
DROP POLICY IF EXISTS "Admins can manage credits" ON public.customer_credits;
DROP POLICY IF EXISTS "Users can view own credits" ON public.customer_credits;
CREATE POLICY "Admins can manage credits" ON public.customer_credits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own credits" ON public.customer_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 7. gift_cards
DROP POLICY IF EXISTS "Public can insert gift cards" ON public.gift_cards;
DROP POLICY IF EXISTS "Allow updates for payment processing" ON public.gift_cards;
DROP POLICY IF EXISTS "Admins can delete gift cards" ON public.gift_cards;
CREATE POLICY "Admins can insert gift cards" ON public.gift_cards
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update gift cards" ON public.gift_cards
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gift cards" ON public.gift_cards
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 8. memberships
DROP POLICY IF EXISTS "Service can insert memberships" ON public.memberships;
DROP POLICY IF EXISTS "Service can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can view own membership for updates" ON public.memberships;
CREATE POLICY "Admins can insert memberships" ON public.memberships
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own membership" ON public.memberships
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users and admins can update memberships" ON public.memberships
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id)
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- 9. system_settings: admin management scoped to signed-in admins (public read kept)
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. time_slots: constrain public schedule generation, restrict edits to admins
DROP POLICY IF EXISTS "Allow insert time slots" ON public.time_slots;
DROP POLICY IF EXISTS "Allow updates for booking system" ON public.time_slots;

CREATE POLICY "Standard schedule slots can be generated" ON public.time_slots
  FOR INSERT
  WITH CHECK (
    service_type = 'combined'
    AND capacity = 5
    AND booked_count = 0
    AND is_available = true
    AND slot_date >= CURRENT_DATE
    AND slot_date <= (CURRENT_DATE + INTERVAL '1 year')
    AND EXTRACT(DOW FROM slot_date) <> 1
    AND slot_time IN (
      '08:30:00','10:00:00','11:30:00','13:00:00','14:30:00',
      '16:00:00','17:30:00','19:00:00',
      '09:00:00','10:30:00','12:00:00','13:30:00','15:00:00'
    )
  );

CREATE POLICY "Admins can insert time slots" ON public.time_slots
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update time slots" ON public.time_slots
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. Storage: keep public file reads via public buckets, stop bucket listing
DROP POLICY IF EXISTS "Public access to data101 bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Blog images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view bucket contents" ON storage.objects;
CREATE POLICY "Admins can view bucket contents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('blog-images', 'events', 'data101')
    AND public.is_admin(auth.uid())
  );
