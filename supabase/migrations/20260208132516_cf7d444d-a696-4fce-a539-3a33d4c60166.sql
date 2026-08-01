-- Add stripe_payment_id column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN stripe_payment_id TEXT;

-- Add an index for faster lookups by payment ID
CREATE INDEX idx_bookings_stripe_payment_id ON public.bookings(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.bookings.stripe_payment_id IS 'Stripe Payment Intent ID for tracking and refunds';