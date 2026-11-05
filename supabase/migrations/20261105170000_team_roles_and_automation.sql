-- ============================================================
-- 1) Service team roles
--    Lead counselor = counselor_student_relationships (one per student).
--    Other team members = counselor_collaborations, now with a role.
-- ============================================================
ALTER TABLE public.counselor_collaborations
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'other';

ALTER TABLE public.counselor_collaborations
  DROP CONSTRAINT IF EXISTS counselor_collaborations_role_check;
ALTER TABLE public.counselor_collaborations
  ADD CONSTRAINT counselor_collaborations_role_check
  CHECK (role IN ('followup', 'essay_interview', 'research', 'other'));

CREATE OR REPLACE FUNCTION public.is_lead_counselor(viewer_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.counselor_student_relationships
    WHERE counselor_id = viewer_id AND student_id = p_student_id
  );
$$;

-- Security fix: before, any counselor could add a collaboration for any
-- student by naming themselves as "primary", and so gain access to that
-- student's data. Only the student's lead counselor (or an admin) may now
-- add, change or remove team members.
DROP POLICY IF EXISTS counselors_create_collaborations ON public.counselor_collaborations;
DROP POLICY IF EXISTS counselors_delete_collaborations ON public.counselor_collaborations;

CREATE POLICY "Lead counselor or admin adds team members"
  ON public.counselor_collaborations FOR INSERT TO authenticated
  WITH CHECK (
    collaborator_id <> student_id
    AND (
      (primary_counselor_id = auth.uid() AND public.is_lead_counselor(auth.uid(), student_id))
      OR public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Lead counselor or admin changes team roles"
  ON public.counselor_collaborations FOR UPDATE TO authenticated
  USING (public.is_lead_counselor(auth.uid(), student_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_lead_counselor(auth.uid(), student_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Lead counselor or admin removes team members"
  ON public.counselor_collaborations FOR DELETE TO authenticated
  USING (public.is_lead_counselor(auth.uid(), student_id) OR public.is_admin(auth.uid()));

-- Everyone on a student's team can see the whole team.
CREATE POLICY "Team members see the student's team"
  ON public.counselor_collaborations FOR SELECT TO authenticated
  USING (public.can_access_student_data(auth.uid(), student_id) OR public.is_admin(auth.uid()));

-- ============================================================
-- 2) Yearly grade and stage automation
-- ============================================================
ALTER TABLE public.student_phases
  ADD COLUMN IF NOT EXISTS last_auto_advance_year integer;

-- Idempotency log for scheduled jobs (only the service role touches it).
CREATE TABLE IF NOT EXISTS public.automation_runs (
  key text PRIMARY KEY,
  ran_at timestamptz NOT NULL DEFAULT now(),
  details jsonb
);
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- Give every current G9–G12 student a starting stage from their grade
-- (G9 exploration, G10 positioning, G11 consolidation, G12 application).
-- Existing stage settings are left untouched.
INSERT INTO public.student_phases (student_id, current_phase, phase_start_date)
SELECT p.id,
       CASE p.status
         WHEN 'G9' THEN 'exploration'
         WHEN 'G10' THEN 'positioning'
         WHEN 'G11' THEN 'consolidation'
         ELSE 'application'
       END,
       CURRENT_DATE
FROM public.profiles p
WHERE p.user_type = 'student'
  AND p.status IN ('G9', 'G10', 'G11', 'G12')
  AND NOT EXISTS (SELECT 1 FROM public.student_phases s WHERE s.student_id = p.id);

-- New students (or students whose grade is first set) get a starting stage
-- automatically. A stage that already exists is never overwritten here.
CREATE OR REPLACE FUNCTION public.ensure_student_phase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_type = 'student' AND NEW.status IN ('G9', 'G10', 'G11', 'G12') THEN
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

REVOKE EXECUTE ON FUNCTION public.ensure_student_phase() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ensure_student_phase ON public.profiles;
CREATE TRIGGER ensure_student_phase
  AFTER INSERT OR UPDATE OF status ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_student_phase();
