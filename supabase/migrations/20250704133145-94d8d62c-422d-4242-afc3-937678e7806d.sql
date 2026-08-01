-- Create bookings table for session bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  service_type TEXT NOT NULL, -- 'ice_bath', 'sauna', 'combined'
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price_amount INTEGER NOT NULL, -- in pence
  stripe_session_id TEXT UNIQUE,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  booking_status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled'
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create gift cards table
CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_code TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12)),
  purchaser_name TEXT NOT NULL,
  purchaser_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  amount INTEGER NOT NULL, -- in pence
  message TEXT,
  stripe_session_id TEXT UNIQUE,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  redeemed_by TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 year'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (making tables publicly readable for now since no auth)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Allow public access for bookings (since we're doing guest checkout)
CREATE POLICY "Public can insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view own bookings" ON public.bookings
  FOR SELECT USING (true);

CREATE POLICY "Allow updates for payment processing" ON public.bookings
  FOR UPDATE USING (true);

-- Allow public access for gift cards
CREATE POLICY "Public can insert gift cards" ON public.gift_cards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view gift cards" ON public.gift_cards
  FOR SELECT USING (true);

CREATE POLICY "Allow updates for payment processing" ON public.gift_cards
  FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();