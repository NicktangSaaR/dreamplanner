
-- 1. profiles: enable RLS and drop blanket-read policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view all profiles" ON public.profiles;

-- Add admin-can-view-all replacement (own + counselor-of-student already exist)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 2. counselor_student_relationships: drop blanket read
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.counselor_student_relationships;

-- 3. todos: drop duplicate permissive SELECT policies (qual=true)
DROP POLICY IF EXISTS "Allow read for todos" ON public.todos;
DROP POLICY IF EXISTS "Allow insert for todos" ON public.todos;

-- 4. admin_google_drive_credentials: per-admin ownership
ALTER TABLE public.admin_google_drive_credentials
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill existing single row to the primary admin
UPDATE public.admin_google_drive_credentials
SET user_id = 'bfbaac29-22ff-45dc-9c20-f42819c3d122'
WHERE user_id IS NULL;

ALTER TABLE public.admin_google_drive_credentials
  ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS admin_google_drive_credentials_user_id_key
  ON public.admin_google_drive_credentials(user_id);

DROP POLICY IF EXISTS "Only admins can view admin credentials" ON public.admin_google_drive_credentials;
DROP POLICY IF EXISTS "Only admins can insert admin credentials" ON public.admin_google_drive_credentials;
DROP POLICY IF EXISTS "Only admins can update admin credentials" ON public.admin_google_drive_credentials;
DROP POLICY IF EXISTS "Only admins can delete admin credentials" ON public.admin_google_drive_credentials;

CREATE POLICY "Admins can view their own drive credentials"
ON public.admin_google_drive_credentials FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert their own drive credentials"
ON public.admin_google_drive_credentials FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update their own drive credentials"
ON public.admin_google_drive_credentials FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND public.is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete their own drive credentials"
ON public.admin_google_drive_credentials FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND public.is_admin(auth.uid()));
