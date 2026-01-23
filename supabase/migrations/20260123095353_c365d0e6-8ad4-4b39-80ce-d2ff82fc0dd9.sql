-- Update business hours to reflect correct closing times
UPDATE system_settings 
SET setting_value = '{
  "monday": {"open": "08:30", "close": "20:00", "closed": true},
  "tuesday": {"open": "08:30", "close": "20:00", "closed": false},
  "wednesday": {"open": "08:30", "close": "20:00", "closed": false},
  "thursday": {"open": "08:30", "close": "20:00", "closed": false},
  "friday": {"open": "08:30", "close": "20:00", "closed": false},
  "saturday": {"open": "08:30", "close": "20:00", "closed": false},
  "sunday": {"open": "09:00", "close": "16:00", "closed": false}
}'::jsonb,
updated_at = now()
WHERE setting_key = 'business_hours';

-- Replace the generate_time_slots function with correct session times
CREATE OR REPLACE FUNCTION public.generate_time_slots(start_date date, end_date date)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  work_date DATE;
  time_slot TIME;
  day_of_week INTEGER;
  -- Tuesday-Saturday times (8 sessions with 30-min gaps)
  weekday_times TIME[] := ARRAY[
    '08:30:00'::TIME, 
    '10:00:00'::TIME, 
    '11:30:00'::TIME, 
    '13:00:00'::TIME, 
    '14:30:00'::TIME, 
    '16:00:00'::TIME, 
    '17:30:00'::TIME, 
    '19:00:00'::TIME
  ];
  -- Sunday times (5 sessions with 30-min gaps)
  sunday_times TIME[] := ARRAY[
    '09:00:00'::TIME, 
    '10:30:00'::TIME, 
    '12:00:00'::TIME, 
    '13:30:00'::TIME, 
    '15:00:00'::TIME
  ];
  slot_times TIME[];
BEGIN
  work_date := start_date;
  
  WHILE work_date <= end_date LOOP
    day_of_week := EXTRACT(DOW FROM work_date);
    
    -- Monday (1) is closed, skip it
    IF day_of_week = 1 THEN
      work_date := work_date + INTERVAL '1 day';
      CONTINUE;
    END IF;
    
    -- Sunday (0) has different times
    IF day_of_week = 0 THEN
      slot_times := sunday_times;
    ELSE
      -- Tuesday (2) through Saturday (6)
      slot_times := weekday_times;
    END IF;
    
    -- Insert each time slot
    FOREACH time_slot IN ARRAY slot_times LOOP
      INSERT INTO public.time_slots (slot_date, slot_time, service_type, capacity, booked_count, is_available)
      VALUES (work_date, time_slot, 'combined', 5, 0, true)
      ON CONFLICT (slot_date, slot_time, service_type) DO NOTHING;
    END LOOP;
    
    work_date := work_date + INTERVAL '1 day';
  END LOOP;
END;
$function$;

-- Delete old incorrect time slots for future dates (keep past bookings intact)
DELETE FROM public.time_slots 
WHERE slot_date >= CURRENT_DATE 
  AND slot_time NOT IN (
    '08:30:00'::TIME, 
    '10:00:00'::TIME, 
    '11:30:00'::TIME, 
    '13:00:00'::TIME, 
    '14:30:00'::TIME, 
    '16:00:00'::TIME, 
    '17:30:00'::TIME, 
    '19:00:00'::TIME,
    '09:00:00'::TIME,
    '10:30:00'::TIME,
    '12:00:00'::TIME,
    '13:30:00'::TIME,
    '15:00:00'::TIME
  )
  AND id NOT IN (SELECT DISTINCT time_slot_id FROM public.bookings WHERE time_slot_id IS NOT NULL);