-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Anyone can read published blog posts"
  ON public.blog_posts
  FOR SELECT
  USING (is_published = true);

-- Admins can do everything
CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial blog posts
INSERT INTO public.blog_posts (title, content, excerpt, is_published, published_at) VALUES
(
  'What Is Contrast Therapy?',
  'Contrast therapy involves alternating between heat (sauna) and cold (ice bath) to support recovery, circulation, and overall wellbeing.

The shift between hot and cold causes blood vessels to expand and contract, helping move blood and nutrients through the body. This process may support muscle recovery, reduce stiffness, and improve how the body handles physical stress.

Cold exposure also challenges the nervous system, encouraging calm breathing, focus, and resilience. Over time, many people find this carries over into daily life.

At Revitalise Hub, contrast therapy is used intentionally - not as an extreme, but as a practical tool for recovery and mental clarity.',
  'Contrast therapy involves alternating between heat (sauna) and cold (ice bath) to support recovery, circulation, and overall wellbeing.',
  true,
  now()
),
(
  'Sauna vs Ice Bath: Why Both Matter',
  'Sauna and ice baths offer different benefits, but they work best when used together.

Heat helps the body relax, increases circulation, and supports recovery. Cold exposure stimulates alertness, challenges the nervous system, and helps reduce muscle soreness.

By alternating between the two, contrast therapy allows the body to move between relaxation and stimulation. This balance can improve recovery while leaving you feeling calm and energised.',
  'Sauna and ice baths offer different benefits, but they work best when used together.',
  true,
  now()
),
(
  'Why Cold Exposure Builds Mental Resilience',
  'Cold exposure feels uncomfortable because it triggers a natural stress response. Heart rate increases, breathing becomes rapid, and the body prepares to react.

By slowing the breath and staying present, you signal safety to the nervous system. Over time, this helps improve stress tolerance and emotional control.

Many people find regular cold exposure improves focus, resilience, and their ability to stay calm under pressure.

At Revitalise Hub, the goal isn''t endurance - it''s learning control in challenging moments.',
  'Cold exposure feels uncomfortable because it triggers a natural stress response. By learning to control your response, you build mental resilience.',
  true,
  now()
);