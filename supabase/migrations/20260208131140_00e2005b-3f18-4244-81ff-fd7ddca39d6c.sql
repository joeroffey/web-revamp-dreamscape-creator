-- Clean up stale pending bookings (abandoned checkouts older than 30 minutes)
-- This is a one-time cleanup; going forward, pending bookings won't be created
DELETE FROM public.bookings 
WHERE payment_status = 'pending' 
AND created_at < NOW() - INTERVAL '30 minutes';