-- Create a function to link orphan memberships when a user signs up
CREATE OR REPLACE FUNCTION public.link_orphan_memberships()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update any memberships that match this user's email but have no user_id
  UPDATE public.memberships
  SET user_id = NEW.id
  WHERE customer_email = LOWER(NEW.email)
    AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created_link_memberships ON auth.users;
CREATE TRIGGER on_auth_user_created_link_memberships
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_orphan_memberships();