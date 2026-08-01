-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  instructor TEXT,
  short_description TEXT,
  full_description TEXT,
  image_url TEXT,
  secondary_image_url TEXT,
  event_dates TEXT[], -- Array of date strings for display
  event_time TEXT,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  additional_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view published events"
ON public.events
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all events"
ON public.events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('events', 'events', true);

-- Storage policies for events bucket
CREATE POLICY "Anyone can view event images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'events');

CREATE POLICY "Admins can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'events' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update event images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'events' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete event images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'events' AND has_role(auth.uid(), 'admin'::app_role));

-- Insert existing events as seed data
INSERT INTO public.events (title, subtitle, instructor, short_description, full_description, image_url, secondary_image_url, event_dates, event_time, display_order, additional_info)
VALUES 
(
  'Soma Breathwork & Contrast Therapy Workshop',
  'A Deeply Restorative Mind–Body Experience',
  'Emma',
  'Join us at Revitalise Hub for a nourishing Soma Breathwork & Contrast Therapy workshop designed to help you reset your nervous system, reconnect with your body, and restore balance from the inside out.',
  'This immersive experience combines guided breathwork with sauna and ice bath contrast therapy, leaving you feeling calm, grounded, and renewed.

**What Is Soma Breathwork?**

Soma Breathwork is a guided breathing practice combining rhythmic breathing, breath retention, visualisation, affirmations, and music.

This method supports nervous system regulation while also enhancing energy, focus, and emotional balance. Emma''s gentle and empowering guidance creates a safe, supportive space to fully relax and drop into the experience.',
  '/events/breathwork-session.jpg',
  '/events/breathwork-setup.jpg',
  ARRAY['1st February', '22nd February', '15th March', '12th April', '26th April', '10th May', '24th May'],
  '3:15pm',
  1,
  '{}'::jsonb
),
(
  'Hot Yoga + Contrast Therapy',
  'Heated Flow Practice',
  'Chloe',
  'A guided hot yoga session focused on mobility, strength, and mindful movement, followed by sauna and ice bath contrast therapy.',
  'Step into a revitalising Hot Yoga & Contrast Therapy workshop designed to support mindful movement, physical release, and deep restoration. This experience helps you slow down, tune into your body, and leave feeling refreshed and energised.

**Hot Yoga: Heated Flow Practice**

Hot yoga is a mindful movement practice performed in a warm environment to support flexibility, mobility, and strength.

The heat helps release tension, improve circulation, and encourage presence and focus. Chloe''s grounded, supportive teaching style makes the session accessible for all levels, with space to move at your own pace.

**Contrast Therapy for Recovery & Resilience**

After yoga, you''ll transition into sauna and ice bath contrast therapy. This supports recovery, reduces muscle soreness, and helps regulate the nervous system — leaving you calm, clear, and rebalanced.',
  '/events/yoga-class.jpg',
  '/events/yoga-pose.jpg',
  ARRAY['7th February'],
  '1pm',
  2,
  '{}'::jsonb
);