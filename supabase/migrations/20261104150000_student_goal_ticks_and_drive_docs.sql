-- 1) Students may tick their own quarter goals done, but nothing else.
--    Counselors and admins keep full control of the quarterly plan.
CREATE OR REPLACE FUNCTION public.enforce_student_quarter_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.role(), '');
  o jsonb;
  n jsonb;
BEGIN
  IF jwt_role IN ('', 'service_role')
     OR public.is_admin(auth.uid())
     OR EXISTS (
       SELECT 1 FROM public.counselor_student_relationships
       WHERE counselor_id = auth.uid() AND student_id = NEW.student_id
     ) THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - 'quarter_kpi' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'quarter_kpi' - 'updated_at') THEN
    RAISE EXCEPTION 'Students can only mark quarter goals as done';
  END IF;

  BEGIN
    o := OLD.quarter_kpi::jsonb;
    n := NEW.quarter_kpi::jsonb;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Quarter goals are not in a format students can update';
  END;

  IF jsonb_typeof(o) <> 'array' OR jsonb_typeof(n) <> 'array'
     OR jsonb_array_length(o) <> jsonb_array_length(n) THEN
    RAISE EXCEPTION 'Students can only mark quarter goals as done';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(o) WITH ORDINALITY AS a(e, i)
    JOIN jsonb_array_elements(n) WITH ORDINALITY AS b(e, i) USING (i)
    WHERE (a.e - 'completed') IS DISTINCT FROM (b.e - 'completed')
       OR jsonb_typeof(b.e -> 'completed') <> 'boolean'
  ) THEN
    RAISE EXCEPTION 'Students can only mark quarter goals as done';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_student_quarter_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_student_quarter_update ON public.student_quarters;
CREATE TRIGGER enforce_student_quarter_update
  BEFORE UPDATE ON public.student_quarters
  FOR EACH ROW EXECUTE FUNCTION public.enforce_student_quarter_update();

DROP POLICY IF EXISTS "Students can tick own quarter goals" ON public.student_quarters;
CREATE POLICY "Students can tick own quarter goals"
  ON public.student_quarters FOR UPDATE TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- 2) Planning documents are set by counselors; students can read them only.
DROP POLICY IF EXISTS "Students can manage their own planning documents" ON public.planning_documents;

-- 3) Remember where a document came from in Google Drive, for re-sync and "open in Drive".
ALTER TABLE public.planning_documents
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS source_url text;
