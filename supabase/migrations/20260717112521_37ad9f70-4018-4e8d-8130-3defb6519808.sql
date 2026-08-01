ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS stripe_session_id text;
CREATE INDEX IF NOT EXISTS memberships_stripe_session_id_idx ON public.memberships(stripe_session_id);