INSERT INTO public.user_roles (user_id, role)
VALUES ('77c80c50-1170-4a89-92c1-b076a5ea7d3e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;