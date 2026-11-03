-- Pre-existing bug: profiles had no UPDATE policy for admins, so the admin
-- dashboard's "verify counselor" and "change user type" actions silently
-- updated 0 rows. Allow admins to update any profile. (Self-escalation by
-- non-admins stays blocked by protect_profile_privileged_fields.)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
