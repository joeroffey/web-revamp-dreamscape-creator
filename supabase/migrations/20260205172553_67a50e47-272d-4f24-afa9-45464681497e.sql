INSERT INTO public.user_roles (user_id, role)
VALUES ('7b1580b8-5a9e-4629-a801-1c84e7c62c45', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;