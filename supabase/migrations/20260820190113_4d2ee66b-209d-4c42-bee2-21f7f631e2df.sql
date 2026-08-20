CREATE TABLE public.conditional_email_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  mailchimp_template_id text NOT NULL,
  template_name text,
  subject text NOT NULL,
  from_name text,
  reply_to text,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  delay_minutes integer NOT NULL DEFAULT 0,
  repeat_policy text NOT NULL DEFAULT 'once_ever',
  repeat_window_days integer,
  mailchimp_tag text,
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  daily_cap integer,
  is_active boolean NOT NULL DEFAULT false,
  last_triggered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conditional_email_rules TO authenticated;
GRANT ALL ON public.conditional_email_rules TO service_role;
ALTER TABLE public.conditional_email_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage conditional email rules"
  ON public.conditional_email_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_conditional_email_rules_updated_at
  BEFORE UPDATE ON public.conditional_email_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.conditional_email_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id uuid NOT NULL REFERENCES public.conditional_email_rules(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name text,
  user_id uuid,
  occurrence_key text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  scheduled_for timestamp with time zone NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  sent_at timestamp with time zone,
  mailchimp_campaign_id text,
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conditional_email_sends_unique_occurrence UNIQUE (rule_id, occurrence_key)
);

CREATE INDEX conditional_email_sends_due_idx
  ON public.conditional_email_sends (status, scheduled_for);
CREATE INDEX conditional_email_sends_email_idx
  ON public.conditional_email_sends (customer_email);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conditional_email_sends TO authenticated;
GRANT ALL ON public.conditional_email_sends TO service_role;
ALTER TABLE public.conditional_email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage conditional email sends"
  ON public.conditional_email_sends FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_conditional_email_sends_updated_at
  BEFORE UPDATE ON public.conditional_email_sends
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.conditional_email_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  global_daily_cap integer NOT NULL DEFAULT 500,
  quiet_hours_start integer NOT NULL DEFAULT 8,
  quiet_hours_end integer NOT NULL DEFAULT 20,
  kill_switch boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.conditional_email_settings TO authenticated;
GRANT ALL ON public.conditional_email_settings TO service_role;
ALTER TABLE public.conditional_email_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage conditional email settings"
  ON public.conditional_email_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_conditional_email_settings_updated_at
  BEFORE UPDATE ON public.conditional_email_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.conditional_email_settings (global_daily_cap) VALUES (500);