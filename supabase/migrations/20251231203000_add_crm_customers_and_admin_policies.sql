-- CRM enhancements for Admin section

-- 1) Customers table (separate from auth users) so Admin can manage customers for bookings
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Admins can manage customers
CREATE POLICY IF NOT EXISTS "Admins can manage customers" ON public.customers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Allow Admins to fully manage bookings (including delete)
CREATE POLICY IF NOT EXISTS "Admins can delete bookings" ON public.bookings
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 3) Allow Admins to view/manage all user profiles (signed-up users)
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Admins can manage profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 4) Allow Admins to view all memberships
CREATE POLICY IF NOT EXISTS "Admins can view all memberships" ON public.memberships
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 5) updated_at trigger for customers
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
