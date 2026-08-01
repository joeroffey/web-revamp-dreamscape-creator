-- Make user_id nullable for manual memberships (cash payments without account)
ALTER TABLE public.memberships ALTER COLUMN user_id DROP NOT NULL;