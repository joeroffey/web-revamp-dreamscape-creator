-- Remove non-combined service time slots
DELETE FROM public.time_slots WHERE service_type IN ('ice_bath', 'sauna');

-- Update the generate_time_slots function to only create combined slots
CREATE OR REPLACE FUNCTION public.generate_time_slots(start_date date, end_date date)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  work_date DATE;
  slot_hour INTEGER;
  time_slot TIME;
BEGIN
  work_date := start_date;
  
  WHILE work_date <= end_date LOOP
    -- Skip Sundays (assuming closed on Sundays)
    IF EXTRACT(DOW FROM work_date) != 0 THEN
      -- Generate slots from 9:00 AM to 7:00 PM, every hour
      slot_hour := 9;
      WHILE slot_hour <= 19 LOOP
        time_slot := (slot_hour || ':00:00')::TIME;
        
        -- Generate slots only for combined service type
        INSERT INTO public.time_slots (slot_date, slot_time, service_type)
        VALUES (work_date, time_slot, 'combined')
        ON CONFLICT (slot_date, slot_time, service_type) DO NOTHING;
        
        slot_hour := slot_hour + 1;
      END LOOP;
    END IF;
    
    work_date := work_date + INTERVAL '1 day';
  END LOOP;
END;
$function$;

-- Generate combined slots for the next 30 days
SELECT public.generate_time_slots(
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 day'
);