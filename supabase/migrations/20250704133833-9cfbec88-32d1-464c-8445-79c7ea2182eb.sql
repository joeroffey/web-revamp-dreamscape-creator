-- Fix the generate_time_slots function with proper variable names
CREATE OR REPLACE FUNCTION public.generate_time_slots(
  start_date DATE,
  end_date DATE
) RETURNS void AS $$
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
        
        -- Generate slots for each service type
        INSERT INTO public.time_slots (slot_date, slot_time, service_type)
        VALUES (work_date, time_slot, 'ice_bath')
        ON CONFLICT (slot_date, slot_time, service_type) DO NOTHING;
        
        INSERT INTO public.time_slots (slot_date, slot_time, service_type)
        VALUES (work_date, time_slot, 'sauna')
        ON CONFLICT (slot_date, slot_time, service_type) DO NOTHING;
        
        INSERT INTO public.time_slots (slot_date, slot_time, service_type)
        VALUES (work_date, time_slot, 'combined')
        ON CONFLICT (slot_date, slot_time, service_type) DO NOTHING;
        
        slot_hour := slot_hour + 1;
      END LOOP;
    END IF;
    
    work_date := work_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate initial time slots for next 30 days
SELECT public.generate_time_slots(CURRENT_DATE, (CURRENT_DATE + INTERVAL '30 days')::DATE);