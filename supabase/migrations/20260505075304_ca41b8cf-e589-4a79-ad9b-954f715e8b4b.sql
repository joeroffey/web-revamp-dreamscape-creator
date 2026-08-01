
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.customers (email, full_name, phone)
  VALUES (
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = COALESCE(public.customers.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.customers.phone, EXCLUDED.phone),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Ensure customers.email is unique for ON CONFLICT to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_email_key'
  ) THEN
    -- Deduplicate first, keeping the oldest record
    DELETE FROM public.customers a
    USING public.customers b
    WHERE a.ctid > b.ctid AND LOWER(a.email) = LOWER(b.email);
    
    -- Normalize emails to lowercase
    UPDATE public.customers SET email = LOWER(email) WHERE email <> LOWER(email);
    
    ALTER TABLE public.customers ADD CONSTRAINT customers_email_key UNIQUE (email);
  END IF;
END $$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing customers from existing auth users
INSERT INTO public.customers (email, full_name, phone)
SELECT 
  LOWER(u.email),
  COALESCE(p.full_name, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  COALESCE(p.phone, u.raw_user_meta_data ->> 'phone')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
  full_name = COALESCE(public.customers.full_name, EXCLUDED.full_name),
  phone = COALESCE(public.customers.phone, EXCLUDED.phone),
  updated_at = now();
