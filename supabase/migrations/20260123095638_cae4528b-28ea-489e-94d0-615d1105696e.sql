-- First, delete all future time slots that don't have bookings
DELETE FROM public.time_slots 
WHERE slot_date >= CURRENT_DATE 
  AND id NOT IN (SELECT DISTINCT time_slot_id FROM public.bookings WHERE time_slot_id IS NOT NULL);

-- Now regenerate the next 30 days of time slots with correct times
DO $$
DECLARE
  work_date DATE;
  time_slot TIME;
  day_of_week INTEGER;
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
  sunday_times TIME[] := ARRAY[
    '09:00:00'::TIME, 
    '10:30:00'::TIME, 
    '12:00:00'::TIME, 
    '13:30:00'::TIME, 
    '15:00:00'::TIME
  ];
  slot_times TIME[];
BEGIN
  work_date := CURRENT_DATE;
  
  WHILE work_date <= CURRENT_DATE + INTERVAL '30 days' LOOP
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
END $$;