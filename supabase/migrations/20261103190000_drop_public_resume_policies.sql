-- SECURITY FIX (2026-11-03), follow-up to 20261103180000.
-- The public resume form now uses token-checked RPCs, so the old permissive
-- policies (which never compared the caller's token) are removed.
DROP POLICY IF EXISTS "Public access to resume_requests via token" ON public.resume_requests;
DROP POLICY IF EXISTS "Public can view resume_data with valid token" ON public.resume_data;
DROP POLICY IF EXISTS "Public can insert resume_data with valid token" ON public.resume_data;
DROP POLICY IF EXISTS "Public can update resume_data with valid token" ON public.resume_data;
