-- Graduate applicants (master's and MBA) next to the existing high-school track.
--
-- profiles.applicant_type: 'undergrad' (default, everyone so far) or 'graduate'.
-- Graduate students have status 'Graduate' (or 'Completed'), a current status
-- (year 1-4, graduated, in a master's), a target degree and a target entry
-- term. Their stages run on a timeline that ends at the entry date:
--   定位 grad_positioning → 背景提升 grad_background → 材料准备 grad_materials
--   → 申请 grad_application → 录取 grad_admission

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS applicant_type text NOT NULL DEFAULT 'undergrad',
  ADD COLUMN IF NOT EXISTS grad_status text,
  ADD COLUMN IF NOT EXISTS grad_degree text,
  ADD COLUMN IF NOT EXISTS target_entry_year integer,
  ADD COLUMN IF NOT EXISTS target_entry_term text;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_graduate_fields_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_graduate_fields_check CHECK (
  applicant_type IN ('undergrad', 'graduate')
  AND (grad_status IS NULL OR grad_status IN ('year1', 'year2', 'year3', 'year4', 'graduated', 'masters'))
  AND (grad_degree IS NULL OR grad_degree IN ('masters', 'mba'))
  AND (target_entry_term IS NULL OR target_entry_term IN ('fall', 'spring'))
  AND (target_entry_year IS NULL OR target_entry_year BETWEEN 2020 AND 2100)
);

ALTER TABLE public.student_phases DROP CONSTRAINT IF EXISTS student_phases_current_phase_check;
ALTER TABLE public.student_phases ADD CONSTRAINT student_phases_current_phase_check CHECK (current_phase IN (
  'exploration', 'positioning', 'consolidation', 'application',
  'grad_positioning', 'grad_background', 'grad_materials', 'grad_application', 'grad_admission'
));

-- Stage on a given day, counting back from the entry date:
--   录取 from 8 months before entry, 申请 from 12, 材料准备 from 16;
--   定位 for the first 2 months after starting (if there is room), then 背景提升.
CREATE OR REPLACE FUNCTION public.grad_phase_for(p_term text, p_year integer, p_start date, p_on date)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  WITH e AS (SELECT make_date(p_year, CASE WHEN p_term = 'spring' THEN 1 ELSE 9 END, 1) AS entry)
  SELECT CASE
    WHEN p_year IS NULL THEN 'grad_positioning'
    WHEN p_on >= (entry - interval '8 months')::date THEN 'grad_admission'
    WHEN p_on >= (entry - interval '12 months')::date THEN 'grad_application'
    WHEN p_on >= (entry - interval '16 months')::date THEN 'grad_materials'
    WHEN p_on >= LEAST((p_start + interval '2 months')::date, (entry - interval '16 months')::date) THEN 'grad_background'
    ELSE 'grad_positioning'
  END FROM e
$$;

-- Sign-up: read the graduate fields too.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  meta jsonb := NEW.raw_user_meta_data;
  requested_type text := meta->>'user_type';
  is_grad boolean := meta->>'applicant_type' = 'graduate';
  chosen_grade text := NULLIF(trim(meta->>'grade'), '');
  start_status text := CASE
    WHEN is_grad THEN 'Graduate'
    WHEN chosen_grade IN ('G7', 'G8', 'Pre-9') THEN 'Pre-9'
    WHEN chosen_grade = 'G11'
     AND extract(month FROM (now() AT TIME ZONE 'America/Vancouver')) IN (7, 8) THEN 'College Bound'
    WHEN chosen_grade IN ('G9', 'G10', 'G11', 'G12') THEN chosen_grade
    WHEN chosen_grade = 'Transfer' THEN 'Transfer Student'
    ELSE NULL
  END;
  g_status text := CASE WHEN is_grad AND meta->>'grad_status' IN ('year1','year2','year3','year4','graduated','masters') THEN meta->>'grad_status' END;
  g_degree text := CASE WHEN is_grad AND meta->>'grad_degree' IN ('masters','mba') THEN meta->>'grad_degree' END;
  g_term text := CASE WHEN is_grad AND meta->>'target_entry_term' IN ('fall','spring') THEN meta->>'target_entry_term' END;
  g_year integer := CASE WHEN is_grad AND (meta->>'target_entry_year') ~ '^\d{4}$' THEN (meta->>'target_entry_year')::integer END;
BEGIN
    INSERT INTO public.profiles (
        id, user_type, full_name, english_name, email, school, grade, status, parent_email, interested_majors,
        applicant_type, grad_status, grad_degree, target_entry_term, target_entry_year
    ) VALUES (
        NEW.id,
        CASE WHEN requested_type IN ('student', 'counselor') THEN requested_type ELSE 'student' END,
        COALESCE(meta->>'full_name', ''),
        meta->>'english_name',
        NEW.email,
        meta->>'school',
        CASE WHEN is_grad THEN NULL ELSE chosen_grade END,
        COALESCE(start_status, 'G9'),
        meta->>'parent_email',
        CASE WHEN meta->>'interested_majors' IS NOT NULL THEN string_to_array(meta->>'interested_majors', ',') ELSE NULL END,
        CASE WHEN is_grad THEN 'graduate' ELSE 'undergrad' END,
        g_status, g_degree, g_term,
        CASE WHEN g_year BETWEEN 2020 AND 2100 THEN g_year END
    );
    RETURN NEW;
END;
$function$;

-- Phase row: high-school students by grade (as before); graduate students by
-- their entry date, recalculated whenever the target entry changes.
CREATE OR REPLACE FUNCTION public.ensure_student_phase()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  gp text;
BEGIN
  IF NEW.user_type <> 'student' THEN
    RETURN NEW;
  END IF;

  IF NEW.applicant_type = 'graduate' THEN
    gp := public.grad_phase_for(NEW.target_entry_term, NEW.target_entry_year, COALESCE(NEW.created_at::date, CURRENT_DATE), CURRENT_DATE);
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.student_phases (student_id, current_phase, phase_start_date)
      VALUES (NEW.id, gp, CURRENT_DATE)
      ON CONFLICT (student_id) DO NOTHING;
    ELSIF NEW.applicant_type IS DISTINCT FROM OLD.applicant_type
       OR NEW.target_entry_year IS DISTINCT FROM OLD.target_entry_year
       OR NEW.target_entry_term IS DISTINCT FROM OLD.target_entry_term THEN
      INSERT INTO public.student_phases (student_id, current_phase, phase_start_date)
      VALUES (NEW.id, gp, CURRENT_DATE)
      ON CONFLICT (student_id) DO UPDATE
        SET current_phase = EXCLUDED.current_phase, phase_start_date = CURRENT_DATE
        WHERE student_phases.current_phase IS DISTINCT FROM EXCLUDED.current_phase;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IN ('G9', 'G10', 'G11', 'G12', 'College Bound') THEN
    INSERT INTO public.student_phases (student_id, current_phase, phase_start_date)
    VALUES (
      NEW.id,
      CASE NEW.status WHEN 'G9' THEN 'exploration' WHEN 'G10' THEN 'positioning' WHEN 'G11' THEN 'consolidation' ELSE 'application' END,
      CURRENT_DATE
    )
    ON CONFLICT (student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- The trigger must also see changes to the graduate fields.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.profiles'::regclass AND NOT tgisinternal
           AND tgfoid = 'public.ensure_student_phase'::regproc LOOP
    EXECUTE format('DROP TRIGGER %I ON public.profiles', t.tgname);
  END LOOP;
END $$;
CREATE TRIGGER ensure_student_phase
  AFTER INSERT OR UPDATE OF status, applicant_type, target_entry_year, target_entry_term ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_student_phase();

-- Only the counselor team changes grade, status and the graduate plan fields.
CREATE OR REPLACE FUNCTION public.protect_student_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  jwt_role text := coalesce(auth.role(), '');
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.grade IS DISTINCT FROM OLD.grade
     OR NEW.applicant_type IS DISTINCT FROM OLD.applicant_type
     OR NEW.grad_status IS DISTINCT FROM OLD.grad_status
     OR NEW.grad_degree IS DISTINCT FROM OLD.grad_degree
     OR NEW.target_entry_year IS DISTINCT FROM OLD.target_entry_year
     OR NEW.target_entry_term IS DISTINCT FROM OLD.target_entry_term THEN
    IF NOT (
      jwt_role IN ('', 'service_role')
      OR public.is_admin(auth.uid())
      OR public.can_manage_student_team(auth.uid(), NEW.id)
    ) THEN
      RAISE EXCEPTION 'Only the counselor team can change a student''s grade, status or application plan';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
