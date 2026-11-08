-- Counselor planning tab v2: quarterly meeting records, current plan document,
-- and write access for the counselor team (lead counselor, follow-up teacher,
-- admin) where only the lead counselor had it before.

-- ---------- meetings ----------
ALTER TABLE public.student_meetings
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS quarter text,
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS decision_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS emailed_to text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS student_meetings_student_quarter_idx
  ON public.student_meetings (student_id, academic_year, quarter, meeting_date DESC);

-- Raw notes and the team note are for the counselor team only, so they live in
-- their own table that students cannot read.
CREATE TABLE IF NOT EXISTS public.meeting_private (
  meeting_id uuid PRIMARY KEY REFERENCES public.student_meetings(id) ON DELETE CASCADE,
  raw_notes text,
  team_note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_private ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team reads and writes private meeting notes" ON public.meeting_private;
CREATE POLICY "Team reads and writes private meeting notes" ON public.meeting_private
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_meetings m WHERE m.id = meeting_id
                 AND (public.can_access_student_data(auth.uid(), m.student_id) OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_meetings m WHERE m.id = meeting_id
                 AND (public.can_access_student_data(auth.uid(), m.student_id) OR public.is_admin(auth.uid()))));

DROP POLICY IF EXISTS "Team manages student meetings" ON public.student_meetings;
CREATE POLICY "Team manages student meetings" ON public.student_meetings
  FOR ALL TO authenticated
  USING (public.can_access_student_data(auth.uid(), student_id))
  WITH CHECK (public.can_access_student_data(auth.uid(), student_id));

ALTER TABLE public.meeting_action_items
  ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS todo_id uuid REFERENCES public.todos(id) ON DELETE SET NULL;
ALTER TABLE public.meeting_action_items DROP CONSTRAINT IF EXISTS meeting_action_items_owner_check;
ALTER TABLE public.meeting_action_items ADD CONSTRAINT meeting_action_items_owner_check
  CHECK (owner IN ('student', 'counselor', 'parent'));

-- Students may read their meeting tasks; only the team changes them.
DROP POLICY IF EXISTS "Access via meeting" ON public.meeting_action_items;
DROP POLICY IF EXISTS "Students read their meeting tasks" ON public.meeting_action_items;
CREATE POLICY "Students read their meeting tasks" ON public.meeting_action_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_meetings m WHERE m.id = meeting_id AND m.student_id = auth.uid()));
DROP POLICY IF EXISTS "Team manages meeting tasks" ON public.meeting_action_items;
CREATE POLICY "Team manages meeting tasks" ON public.meeting_action_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_meetings m WHERE m.id = meeting_id
                 AND (public.can_access_student_data(auth.uid(), m.student_id) OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_meetings m WHERE m.id = meeting_id
                 AND (public.can_access_student_data(auth.uid(), m.student_id) OR public.is_admin(auth.uid()))));

-- ---------- quarters, plan documents ----------
DROP POLICY IF EXISTS "Counselor team manages quarters" ON public.student_quarters;
CREATE POLICY "Counselor team manages quarters" ON public.student_quarters
  FOR ALL TO authenticated
  USING (public.can_manage_student_team(auth.uid(), student_id))
  WITH CHECK (public.can_manage_student_team(auth.uid(), student_id));

DROP POLICY IF EXISTS "Team views planning documents" ON public.planning_documents;
CREATE POLICY "Team views planning documents" ON public.planning_documents
  FOR SELECT TO authenticated
  USING (public.can_access_student_data(auth.uid(), student_id) OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Counselor team manages planning documents" ON public.planning_documents;
CREATE POLICY "Counselor team manages planning documents" ON public.planning_documents
  FOR ALL TO authenticated
  USING (public.can_manage_student_team(auth.uid(), student_id))
  WITH CHECK (public.can_manage_student_team(auth.uid(), student_id));

-- One current plan per student: is_primary. Give students without one their latest document.
UPDATE public.planning_documents d SET is_primary = true
 WHERE d.id IN (
   SELECT DISTINCT ON (student_id) id FROM public.planning_documents
    WHERE student_id NOT IN (SELECT student_id FROM public.planning_documents WHERE is_primary)
    ORDER BY student_id, updated_at DESC
 );

-- Make a document the current plan (and no other) in one step.
CREATE OR REPLACE FUNCTION public.set_current_plan(p_doc_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sid uuid;
BEGIN
  SELECT student_id INTO sid FROM planning_documents WHERE id = p_doc_id;
  IF sid IS NULL THEN RAISE EXCEPTION 'document not found'; END IF;
  IF NOT (public.can_manage_student_team(auth.uid(), sid) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  UPDATE planning_documents SET is_primary = (id = p_doc_id) WHERE student_id = sid AND is_primary IS DISTINCT FROM (id = p_doc_id);
END $$;
REVOKE ALL ON FUNCTION public.set_current_plan(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.set_current_plan(uuid) TO authenticated;
