-- Create time slots table for managing availability
CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  service_type TEXT NOT NULL, -- 'ice_bath', 'sauna', 'combined'
  is_available BOOLEAN DEFAULT TRUE,
  capacity INTEGER DEFAULT 1,
  booked_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(slot_date, slot_time, service_type)
);

-- Enable Row Level Security
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- Allow public read access to time slots
CREATE POLICY "Public can view time slots" ON public.time_slots
  FOR SELECT USING (true);

-- Allow updates for booking system
CREATE POLICY "Allow updates for booking system" ON public.time_slots
  FOR UPDATE USING (true);

-- Allow inserts for slot generation
CREATE POLICY "Allow insert time slots" ON public.time_slots
  FOR INSERT WITH CHECK (true);

-- Add constraint to bookings table to reference time slots
ALTER TABLE public.bookings 
ADD COLUMN time_slot_id UUID REFERENCES public.time_slots(id);

-- Create index for better performance
CREATE INDEX idx_time_slots_availability ON public.time_slots(slot_date, service_type, is_available);
CREATE INDEX idx_bookings_time_slot ON public.bookings(time_slot_id);

-- Create trigger for time slots updates
CREATE TRIGGER update_time_slots_updated_at
  BEFORE UPDATE ON public.time_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate time slots for a given date range
CREATE OR REPLACE FUNCTION public.generate_time_slots(
  start_date DATE,
  end_date DATE
) RETURNS void AS $$
DECLARE
  current_date DATE;
  slot_time TIME;
  service TEXT;
BEGIN
  current_date := start_date;
  
  WHILE current_date <= end_date LOOP
    -- Skip Sundays (assuming closed on Sundays)
    IF EXTRACT(DOW FROM current_date) != 0 THEN
      -- Generate slots from 9:00 AM to 7:00 PM, every hour
      FOR hour IN 9..19 LOOP
        slot_time := (hour || ':00:00')::TIME;
        
        -- Generate slots for each service type
        FOREACH service IN ARRAY ARRAY['ice_bath', 'sauna', 'combined'] LOOP
          INSERT INTO public.time_slots (slot_date, slot_time, service_type)
          VALUES (current_date, slot_time, service)
          ON CONFLICT (slot_date, slot_time, service_type) DO NOTHING;
        END LOOP;
      END LOOP;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate slots for the next 30 days
SELECT public.generate_time_slots(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- Enable realtime for time_slots table
ALTER TABLE public.time_slots REPLICA IDENTITY FULL;

-- Function to handle booking confirmation and slot management
CREATE OR REPLACE FUNCTION public.confirm_booking(
  p_time_slot_id UUID,
  p_stripe_session_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  slot_available BOOLEAN;
  booking_exists BOOLEAN;
BEGIN
  -- Check if slot is still available
  SELECT is_available AND (booked_count < capacity) 
  INTO slot_available
  FROM public.time_slots 
  WHERE id = p_time_slot_id;
  
  IF NOT slot_available THEN
    RETURN FALSE;
  END IF;
  
  -- Check if booking already exists for this session
  SELECT EXISTS(
    SELECT 1 FROM public.bookings 
    WHERE stripe_session_id = p_stripe_session_id
  ) INTO booking_exists;
  
  IF booking_exists THEN
    RETURN TRUE; -- Already processed
  END IF;
  
  -- Update the time slot
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
$$ LANGUAGE plpgsql;