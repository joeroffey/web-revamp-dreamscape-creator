-- Add auto-renewal tracking to memberships table
ALTER TABLE public.memberships 
ADD COLUMN IF NOT EXISTS is_auto_renew boolean DEFAULT false;