-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create memberships table
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  membership_type TEXT NOT NULL CHECK (membership_type IN ('1_session_week', '2_sessions_week', 'unlimited')),
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
  sessions_per_week INTEGER NOT NULL,
  sessions_remaining INTEGER DEFAULT 0,
  last_session_reset TIMESTAMPTZ DEFAULT now(),
  discount_percentage INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for memberships
CREATE POLICY "Users can view own membership" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own membership for updates" ON public.memberships
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service can insert memberships" ON public.memberships
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update memberships" ON public.memberships
  FOR UPDATE USING (true);

-- Add user_id to bookings table and update existing bookings table
ALTER TABLE public.bookings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the confirm_booking function to only mark slots unavailable after payment confirmation
CREATE OR REPLACE FUNCTION public.confirm_booking(p_time_slot_id uuid, p_stripe_session_id text)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
  slot_available BOOLEAN;
  booking_exists BOOLEAN;
BEGIN
  -- Check if slot is still available (ignoring temporary reservations)
  SELECT is_available 
  INTO slot_available
  FROM public.time_slots 
  WHERE id = p_time_slot_id;
  
  IF NOT slot_available THEN
    RETURN FALSE;
  END IF;
  
  -- Check if booking already exists for this session
  SELECT EXISTS(
    SELECT 1 FROM public.bookings 
    WHERE stripe_session_id = p_stripe_session_id AND payment_status = 'paid'
  ) INTO booking_exists;
  
  IF booking_exists THEN
    RETURN TRUE; -- Already processed
  END IF;
  
  -- Update the time slot to unavailable only now
  UPDATE public.time_slots
  SET 
    booked_count = booked_count + 1,
    is_available = CASE 
      WHEN booked_count + 1 >= capacity THEN FALSE 
      ELSE TRUE 
    END,
    updated_at = now()
  WHERE id = p_time_slot_id;
  
  -- Update the booking with confirmed payment
  UPDATE public.bookings
  SET 
    payment_status = 'paid',
    booking_status = 'confirmed',
    updated_at = now()
  WHERE stripe_session_id = p_stripe_session_id;
  
  RETURN TRUE;
END;
$function$;