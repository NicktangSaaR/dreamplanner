DROP POLICY IF EXISTS "Counselors can view their students' profiles" ON public.profiles;
CREATE POLICY "Counselors can view their students' profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.is_counselor(auth.uid())
  AND public.can_access_student_data(auth.uid(), id)
);