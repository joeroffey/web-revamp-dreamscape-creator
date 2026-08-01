-- Create customer_tokens table to track token balances
CREATE TABLE public.customer_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  tokens_remaining INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means never expires
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can manage tokens
CREATE POLICY "Admins can manage customer tokens"
ON public.customer_tokens
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_customer_tokens_email ON public.customer_tokens(customer_email);
CREATE INDEX idx_customer_tokens_expires ON public.customer_tokens(expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_customer_tokens_updated_at
BEFORE UPDATE ON public.customer_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();