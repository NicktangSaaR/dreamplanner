-- Resumes: the student's lead counselor, follow-up teachers and admins can
-- start and edit a student's resume; the whole team can read it.
DROP POLICY IF EXISTS "Team managers manage student resume data" ON public.resume_data;
CREATE POLICY "Team managers manage student resume data"
  ON public.resume_data FOR ALL TO authenticated
  USING (public.can_manage_student_team(auth.uid(), student_id))
  WITH CHECK (public.can_manage_student_team(auth.uid(), student_id));

DROP POLICY IF EXISTS "Team can view student resume data" ON public.resume_data;
CREATE POLICY "Team can view student resume data"
  ON public.resume_data FOR SELECT TO authenticated
  USING (public.can_access_student_data(auth.uid(), student_id));

DROP POLICY IF EXISTS "Team can view student resume requests" ON public.resume_requests;
CREATE POLICY "Team can view student resume requests"
  ON public.resume_requests FOR SELECT TO authenticated
  USING (public.can_access_student_data(auth.uid(), student_id));

DROP POLICY IF EXISTS "Team managers start resume requests" ON public.resume_requests;
CREATE POLICY "Team managers start resume requests"
  ON public.resume_requests FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid() AND public.can_manage_student_team(auth.uid(), student_id));

DROP POLICY IF EXISTS "Team managers update resume requests" ON public.resume_requests;
CREATE POLICY "Team managers update resume requests"
  ON public.resume_requests FOR UPDATE TO authenticated
  USING (public.can_manage_student_team(auth.uid(), student_id))
  WITH CHECK (public.can_manage_student_team(auth.uid(), student_id));

-- Students mark their own resume form as submitted (this was missing, so
-- the student's "submit" button failed).
DROP POLICY IF EXISTS "Students submit their own resume requests" ON public.resume_requests;
CREATE POLICY "Students submit their own resume requests"
  ON public.resume_requests FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
