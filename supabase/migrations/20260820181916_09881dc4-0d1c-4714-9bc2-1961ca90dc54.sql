-- Backfill: link orphan memberships to their auth user by email
UPDATE public.memberships m
SET user_id = u.id, updated_at = now()
FROM auth.users u
WHERE m.user_id IS NULL
  AND lower(u.email) = lower(m.customer_email);

-- Auto-link memberships to an existing account at insert/email-change time
CREATE OR REPLACE FUNCTION public.link_membership_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.customer_email IS NOT NULL THEN
    SELECT u.id INTO NEW.user_id
    FROM auth.users u
    WHERE lower(u.email) = lower(NEW.customer_email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.link_membership_to_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS link_membership_to_user_trg ON public.memberships;
CREATE TRIGGER link_membership_to_user_trg
BEFORE INSERT OR UPDATE OF customer_email ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.link_membership_to_user();