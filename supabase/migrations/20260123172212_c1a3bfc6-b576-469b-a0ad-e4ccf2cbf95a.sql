-- Drop the old constraint and add updated one with monthly membership types
ALTER TABLE public.memberships DROP CONSTRAINT memberships_membership_type_check;

ALTER TABLE public.memberships ADD CONSTRAINT memberships_membership_type_check 
CHECK (membership_type = ANY (ARRAY[
  '1_session_week'::text, 
  '2_sessions_week'::text, 
  '4_sessions_month'::text,
  '8_sessions_month'::text,
  'unlimited'::text
]));