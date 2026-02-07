-- Create table to track password reset emails sent
CREATE TABLE IF NOT EXISTS public.password_reset_email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT
);

-- Add index for quick lookups
CREATE INDEX idx_password_reset_email_log_email ON public.password_reset_email_log(email);
CREATE INDEX idx_password_reset_email_log_user_id ON public.password_reset_email_log(user_id);

-- Enable RLS but allow service role full access
ALTER TABLE public.password_reset_email_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view this table
CREATE POLICY "Admins can view password reset logs"
  ON public.password_reset_email_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));