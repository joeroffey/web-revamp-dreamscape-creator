DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage customer tokens" ON public.customer_tokens;
CREATE POLICY "Admins can manage customer tokens" ON public.customer_tokens
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage discount codes" ON public.discount_codes;
CREATE POLICY "Admins can manage discount codes" ON public.discount_codes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view redemptions" ON public.discount_redemptions;
DROP POLICY IF EXISTS "Admin can manage redemptions" ON public.discount_redemptions;
CREATE POLICY "Admin can manage redemptions" ON public.discount_redemptions
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
CREATE POLICY "Admins can manage all events" ON public.events
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage partner codes" ON public.partner_codes;
CREATE POLICY "Admins can manage partner codes" ON public.partner_codes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view password reset logs" ON public.password_reset_email_log;
CREATE POLICY "Admins can view password reset logs" ON public.password_reset_email_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage pricing" ON public.pricing_config;
CREATE POLICY "Admins can manage pricing" ON public.pricing_config
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;
CREATE POLICY "Admins can upload bucket images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('blog-images','events','data101') AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can update bucket images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('blog-images','events','data101') AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id IN ('blog-images','events','data101') AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete bucket images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('blog-images','events','data101') AND public.is_admin(auth.uid()));