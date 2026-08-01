-- Function to create customer record when profile is created
CREATE OR REPLACE FUNCTION public.sync_profile_to_customer()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if customer already exists for this email
  IF (TG_OP = 'INSERT') THEN
    -- Only run on INSERT (new profile)
    PERFORM 1 FROM public.customers WHERE email = NEW.email;

    IF NOT FOUND THEN
      -- No customer exists, create one
      INSERT INTO public.customers (
        email,
        full_name,
        phone,
        created_at,
        updated_at
      ) VALUES (
        NEW.email,
        COALESCE(NEW.full_name, ''),
        COALESCE(NEW.phone, ''),
        NOW(),
        NOW()
      );
    END IF;

    -- Return NEW for INSERT triggers
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Optional: keep customer in sync with profile updates
    UPDATE public.customers
    SET
      full_name = COALESCE(NEW.full_name, ''),
      phone = COALESCE(NEW.phone, ''),
      updated_at = NOW()
    WHERE email = NEW.email;

    RETURN NEW;
  END IF;

  RETURN NULL; -- Should not reach here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync profiles to customers
DROP TRIGGER IF EXISTS sync_profiles_to_customers ON public.profiles;
CREATE TRIGGER sync_profiles_to_customers
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_customer();