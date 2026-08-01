-- Add customer details and date columns to memberships table
ALTER TABLE public.memberships 
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date date;

-- Update existing memberships to have end_date = start_date + 1 month
UPDATE public.memberships 
SET end_date = COALESCE(start_date, created_at::date) + INTERVAL '1 month'
WHERE end_date IS NULL;

-- Fix the handle_new_user trigger to properly save user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$function$;

-- Create function to reset weekly sessions for active memberships
CREATE OR REPLACE FUNCTION public.reset_weekly_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.memberships
  SET 
    sessions_remaining = sessions_per_week,
    last_session_reset = now(),
    updated_at = now()
  WHERE status = 'active'
    AND end_date >= CURRENT_DATE
    AND membership_type != 'unlimited';
END;
$function$;

-- Create function to check and expire old memberships
CREATE OR REPLACE FUNCTION public.expire_old_memberships()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.memberships
  SET 
    status = 'expired',
    updated_at = now()
  WHERE status = 'active'
    AND end_date < CURRENT_DATE;
END;
$function$;