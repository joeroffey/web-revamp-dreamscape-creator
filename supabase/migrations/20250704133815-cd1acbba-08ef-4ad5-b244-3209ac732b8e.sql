-- Fix the generate_time_slots function
CREATE OR REPLACE FUNCTION public.generate_time_slots(
  start_date DATE,
  end_date DATE
) RETURNS void AS $$
DECLARE
  work_date DATE;
  current_time TIME;
  hour_val INTEGER;
BEGIN
  work_date := start_date;
  
  WHILE work_date <= end_date LOOP
    -- Skip Sundays (assuming closed on Sundays)
    IF EXTRACT(DOW FROM work_date) != 0 THEN
      -- Generate slots from 9:00 AM to 7:00 PM, every hour
      hour_val := 9;
      WHILE hour_val <= 19 LOOP
        current_time := (hour_val || ':00:00')::TIME;
        
        -- Generate slots for each service type
        INSERT INTO public.time_slots (slot_date, slot_time, service_type)
        VALUES (work_date, current_time, 'ice_bath')
        ON CONFLICT (slot_date, slot_time, service_type) DO NOTHING;
        
        INSERT INTO public.time_slots (slot_date, slot_time, service_type)
        VALUES (work_date, current_time, 'sauna')
        ON CONFLICT (slot_date, slot_time, service_type) DO NOTHING;
        
        INSERT INTO public.time_slots (slot_date, slot_time, service_type)
        VALUES (work_date, current_time, 'combined')
        ON CONFLICT (slot_date, slot_time, service_type) DO NOTHING;
        
        hour_val := hour_val + 1;
      END LOOP;
    END IF;
    
    work_date := work_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate initial time slots
SELECT public.generate_time_slots(CURRENT_DATE, (CURRENT_DATE + INTERVAL '30 days')::DATE);