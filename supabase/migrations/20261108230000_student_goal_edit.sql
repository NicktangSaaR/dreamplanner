-- Students may add, tick and reword their quarter goals, but not delete them.
-- The counselor team (lead counselor, follow-up teacher, admin) may do
-- anything. Before this, the trigger only exempted the lead counselor, so a
-- follow-up teacher's edits were rejected as if they were a student.

CREATE OR REPLACE FUNCTION public.enforce_student_quarter_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  jwt_role text := coalesce(auth.role(), '');
  o jsonb := '[]'::jsonb;
  n jsonb;
BEGIN
  IF jwt_role IN ('', 'service_role')
     OR public.is_admin(auth.uid())
     OR public.can_manage_student_team(auth.uid(), NEW.student_id) THEN
    RETURN NEW;
  END IF;

  -- From here on the writer is the student (row-level security allows no one else).
  IF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - 'quarter_kpi' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'quarter_kpi' - 'updated_at') THEN
      RAISE EXCEPTION 'Students can only change their quarter goals';
    END IF;
    BEGIN
      o := coalesce(nullif(OLD.quarter_kpi, ''), '[]')::jsonb;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'These quarter goals can only be changed by the counselor';
    END;
  ELSE
    IF coalesce(NEW.quarter_focus, '') <> '' OR coalesce(NEW.quarter_risk, '') <> '' THEN
      RAISE EXCEPTION 'Students can only add quarter goals';
    END IF;
  END IF;

  BEGIN
    n := coalesce(nullif(NEW.quarter_kpi, ''), '[]')::jsonb;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Quarter goals must be a list';
  END;

  IF jsonb_typeof(o) <> 'array' OR jsonb_typeof(n) <> 'array' THEN
    RAISE EXCEPTION 'These quarter goals can only be changed by the counselor';
  END IF;

  -- Every goal must be well formed.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(n) e
    WHERE jsonb_typeof(e) <> 'object'
       OR jsonb_typeof(e -> 'id') <> 'string'
       OR jsonb_typeof(e -> 'text') <> 'string'
       OR length(trim(e ->> 'text')) = 0
       OR length(e ->> 'text') > 300
       OR jsonb_typeof(e -> 'completed') <> 'boolean'
  ) THEN
    RAISE EXCEPTION 'Each goal needs text and a done flag';
  END IF;

  -- No goal may disappear.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(o) a
    WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(n) b WHERE b ->> 'id' = a ->> 'id')
  ) THEN
    RAISE EXCEPTION 'Students cannot delete quarter goals';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_student_quarter_update ON public.student_quarters;
CREATE TRIGGER enforce_student_quarter_update
  BEFORE INSERT OR UPDATE ON public.student_quarters
  FOR EACH ROW EXECUTE FUNCTION public.enforce_student_quarter_update();

DROP POLICY IF EXISTS "Students can add own quarter goals" ON public.student_quarters;
CREATE POLICY "Students can add own quarter goals" ON public.student_quarters
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);
