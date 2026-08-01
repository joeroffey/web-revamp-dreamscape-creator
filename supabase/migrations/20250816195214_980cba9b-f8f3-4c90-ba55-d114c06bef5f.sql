-- Create discount codes table for promotions
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on discount_codes table
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for discount_codes
CREATE POLICY "Admins can manage discount codes" 
ON public.discount_codes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active discount codes" 
ON public.discount_codes 
FOR SELECT 
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_discount_codes_updated_at
BEFORE UPDATE ON public.discount_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample discount codes
INSERT INTO public.discount_codes (code, description, discount_type, discount_value, min_amount, max_uses, valid_until) VALUES
('WELCOME10', 'Welcome offer for new customers', 'percentage', 10.00, 0, 100, now() + interval '3 months'),
('SUMMER20', 'Summer special discount', 'percentage', 20.00, 5000, 50, now() + interval '2 months'),
('NEWCLIENT', 'New client fixed discount', 'fixed', 1500, 0, 200, now() + interval '6 months');