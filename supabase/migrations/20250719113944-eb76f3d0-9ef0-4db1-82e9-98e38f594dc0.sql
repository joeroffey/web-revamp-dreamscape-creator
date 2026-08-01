-- Create booking type enum
CREATE TYPE public.booking_type AS ENUM ('communal', 'private');

-- Add booking_type and guest_count to bookings table
ALTER TABLE public.bookings 
ADD COLUMN booking_type booking_type NOT NULL DEFAULT 'communal',
ADD COLUMN guest_count integer NOT NULL DEFAULT 1;

-- Update time_slots capacity to 5 for communal bookings
UPDATE public.time_slots SET capacity = 5 WHERE capacity = 1;

-- Update the confirm_booking function to handle new booking logic
CREATE OR REPLACE FUNCTION public.confirm_booking(p_time_slot_id uuid, p_stripe_session_id text)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
  slot_available BOOLEAN;
  booking_exists BOOLEAN;
  booking_info RECORD;
  current_communal_count INTEGER := 0;
  has_private_booking BOOLEAN := FALSE;
BEGIN
  -- Get booking information
  SELECT booking_type, guest_count 
  INTO booking_info
  FROM public.bookings 
  WHERE stripe_session_id = p_stripe_session_id AND payment_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if booking already confirmed
  SELECT EXISTS(
    SELECT 1 FROM public.bookings 
    WHERE stripe_session_id = p_stripe_session_id AND payment_status = 'paid'
  ) INTO booking_exists;
  
  IF booking_exists THEN
    RETURN TRUE; -- Already processed
  END IF;
  
  -- Check current slot status
  SELECT 
    is_available,
    COALESCE((
      SELECT SUM(guest_count) 
      FROM public.bookings 
      WHERE time_slot_id = p_time_slot_id 
        AND payment_status = 'paid' 
        AND booking_type = 'communal'
    ), 0) as communal_count,
    EXISTS(
      SELECT 1 
      FROM public.bookings 
      WHERE time_slot_id = p_time_slot_id 
        AND payment_status = 'paid' 
        AND booking_type = 'private'
    ) as has_private
  INTO slot_available, current_communal_count, has_private_booking
  FROM public.time_slots 
  WHERE id = p_time_slot_id;
  
  -- Validate booking based on type
  IF booking_info.booking_type = 'private' THEN
    -- Private booking not allowed if any communal bookings exist
    IF current_communal_count > 0 THEN
      RETURN FALSE;
    END IF;
    
    -- Private booking not allowed if another private booking exists
    IF has_private_booking THEN
      RETURN FALSE;
    END IF;
    
    -- Mark slot as unavailable for private booking
    UPDATE public.time_slots
    SET 
      is_available = FALSE,
      booked_count = 5, -- Private takes full capacity
      updated_at = now()
    WHERE id = p_time_slot_id;
    
  ELSE -- Communal booking
    -- Communal booking not allowed if private booking exists
    IF has_private_booking THEN
      RETURN FALSE;
    END IF;
    
    -- Check if enough space for communal booking
    IF current_communal_count + booking_info.guest_count > 5 THEN
      RETURN FALSE;
    END IF;
    
    -- Update slot availability based on new communal count
    UPDATE public.time_slots
    SET 
      booked_count = current_communal_count + booking_info.guest_count,
      is_available = CASE 
        WHEN current_communal_count + booking_info.guest_count >= 5 THEN FALSE 
        ELSE TRUE 
      END,
      updated_at = now()
    WHERE id = p_time_slot_id;
  END IF;
  
  -- Confirm the booking
  UPDATE public.bookings
  SET 
    payment_status = 'paid',
    booking_status = 'confirmed',
    updated_at = now()
  WHERE stripe_session_id = p_stripe_session_id;
  
  RETURN TRUE;
END;
$function$;

-- Create function to get available spaces for communal bookings
CREATE OR REPLACE FUNCTION public.get_available_communal_spaces(p_time_slot_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  current_communal_count INTEGER := 0;
  has_private_booking BOOLEAN := FALSE;
BEGIN
  -- Check current bookings
  SELECT 
    COALESCE((
      SELECT SUM(guest_count) 
      FROM public.bookings 
      WHERE time_slot_id = p_time_slot_id 
        AND payment_status = 'paid' 
        AND booking_type = 'communal'
    ), 0) as communal_count,
    EXISTS(
      SELECT 1 
      FROM public.bookings 
      WHERE time_slot_id = p_time_slot_id 
        AND payment_status = 'paid' 
        AND booking_type = 'private'
    ) as has_private
  INTO current_communal_count, has_private_booking;
  
  -- If private booking exists, no communal spaces available
  IF has_private_booking THEN
    RETURN 0;
  END IF;
  
  -- Return remaining communal spaces
  RETURN GREATEST(0, 5 - current_communal_count);
END;
$function$;