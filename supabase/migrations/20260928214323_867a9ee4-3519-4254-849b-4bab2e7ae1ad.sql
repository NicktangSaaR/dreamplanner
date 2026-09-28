DROP POLICY IF EXISTS "Counselors can view their students' profiles" ON public.profiles;
CREATE POLICY "Counselors can view their students' profiles" ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.counselor_student_relationships r WHERE r.counselor_id = auth.uid() AND r.student_id = profiles.id)
  OR public.is_counselor(auth.uid())
);