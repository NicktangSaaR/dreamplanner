-- SECURITY FIX (applied to production 2026-11-03).
-- update_user_credentials is SECURITY DEFINER and trusts its admin_id
-- argument instead of auth.uid(). While it was executable by anon/authenticated,
-- anyone who knew an admin's UUID could change any user's email or password.
-- The only legitimate caller is the update-user-email edge function, which
-- verifies the admin's JWT and calls this RPC with the service role key.
REVOKE EXECUTE ON FUNCTION public.update_user_credentials(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_credentials(uuid, uuid, text, text)
  TO service_role;
