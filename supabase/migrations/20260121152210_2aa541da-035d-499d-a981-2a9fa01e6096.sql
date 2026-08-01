-- First, delete old service types and duplicates, keeping only one combined and one private entry
DELETE FROM pricing_config WHERE service_type IN ('iceBath', 'sauna');

-- Delete duplicates for combined, keeping only one
DELETE FROM pricing_config 
WHERE service_type = 'combined' 
AND id != (SELECT id FROM pricing_config WHERE service_type = 'combined' ORDER BY created_at ASC LIMIT 1);

-- Add unique constraint on service_type to prevent duplicates
ALTER TABLE pricing_config ADD CONSTRAINT pricing_config_service_type_key UNIQUE (service_type);

-- Upsert correct prices: Communal (combined) = £18 (1800 pence), Private = £70 (7000 pence)
INSERT INTO pricing_config (service_type, price_amount, duration_minutes, is_active, description)
VALUES 
  ('combined', 1800, 60, true, 'Communal Session - Per person price'),
  ('private', 7000, 60, true, 'Private Session - Flat rate for exclusive use')
ON CONFLICT (service_type) 
DO UPDATE SET 
  price_amount = EXCLUDED.price_amount,
  description = EXCLUDED.description,
  updated_at = now();