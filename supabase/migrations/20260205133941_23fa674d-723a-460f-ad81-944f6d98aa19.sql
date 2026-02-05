-- Create customer_credits table to track gift card credits
CREATE TABLE public.customer_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  credit_balance INTEGER NOT NULL DEFAULT 0, -- in pence
  gift_card_id UUID REFERENCES public.gift_cards(id),
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own credits"
  ON public.customer_credits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage credits"
  ON public.customer_credits
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert credits"
  ON public.customer_credits
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update credits"
  ON public.customer_credits
  FOR UPDATE
  USING (true);

-- Update timestamp trigger
CREATE TRIGGER update_customer_credits_updated_at
  BEFORE UPDATE ON public.customer_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();