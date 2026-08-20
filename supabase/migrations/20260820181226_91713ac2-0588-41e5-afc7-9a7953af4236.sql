REVOKE ALL ON FUNCTION public.expire_old_memberships() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_weekly_sessions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_admin_action() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.link_orphan_memberships() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_booking(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_booking(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;