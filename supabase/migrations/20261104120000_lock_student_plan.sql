-- The plan (stage, quarter goals, reports) is set by counselors and admins.
-- Students can read it, but can no longer change it, and only see
-- reports their counselor has published.

DROP POLICY IF EXISTS "Students can update own phase" ON public.student_phases;
DROP POLICY IF EXISTS "Students can insert own phase" ON public.student_phases;

DROP POLICY IF EXISTS "Students can manage own quarters" ON public.student_quarters;

DROP POLICY IF EXISTS "Students view own reports" ON public.planning_reports;
CREATE POLICY "Students view own published reports"
  ON public.planning_reports FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND status = 'published');
