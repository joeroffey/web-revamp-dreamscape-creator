INSERT INTO public.user_roles (user_id, role)
VALUES ('3ae55651-f0a9-451c-a54d-816db879c450', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;