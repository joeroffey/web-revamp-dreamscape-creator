-- Create partner_codes table for company promo codes
CREATE TABLE public.partner_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  promo_code TEXT NOT NULL UNIQUE,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage partner codes
CREATE POLICY "Admins can manage partner codes"
ON public.partner_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can view active partner codes (for validation at checkout)
CREATE POLICY "Public can view active partner codes"
ON public.partner_codes
FOR SELECT
USING (is_active = true);

-- Create updated_at trigger
CREATE TRIGGER update_partner_codes_updated_at
  BEFORE UPDATE ON public.partner_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();