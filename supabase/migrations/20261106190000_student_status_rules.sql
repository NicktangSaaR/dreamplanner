-- Who may change what on a student's profile:
--   * profile details: the student, their lead counselor, a follow-up
--     teacher on their team, or an admin;
--   * grade and service status: lead counselor, follow-up teacher or admin
--     only (not the student).

DROP POLICY IF EXISTS "Team managers update student profiles" ON public.profiles;
CREATE POLICY "Team managers update student profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_type = 'student' AND public.can_manage_student_team(auth.uid(), id))
  WITH CHECK (user_type = 'student' AND public.can_manage_student_team(auth.uid(), id));

CREATE OR REPLACE FUNCTION public.protect_student_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.role(), '');
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.grade IS DISTINCT FROM OLD.grade THEN
    IF NOT (
      jwt_role IN ('', 'service_role')
      OR public.is_admin(auth.uid())
      OR public.can_manage_student_team(auth.uid(), NEW.id)
    ) THEN
      RAISE EXCEPTION 'Only the counselor team can change a student''s grade or service status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_student_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_student_status ON public.profiles;
CREATE TRIGGER protect_student_status
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_student_status();

-- College Bound students are in the application stage.
CREATE OR REPLACE FUNCTION public.ensure_student_phase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_type = 'student' AND NEW.status IN ('G9', 'G10', 'G11', 'G12', 'College Bound') THEN
    INSERT INTO public.student_phases (student_id, current_phase, phase_start_date)
    VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'G9' THEN 'exploration'
        WHEN 'G10' THEN 'positioning'
        WHEN 'G11' THEN 'consolidation'
        ELSE 'application'
      END,
      CURRENT_DATE
    )
    ON CONFLICT (student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
