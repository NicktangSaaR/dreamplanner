CREATE TABLE public.planning_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type text NOT NULL DEFAULT 'quarterly', -- 'quarterly' or 'annual'
  title text NOT NULL,
  quarter text, -- e.g. 'Q1_fall', null for annual
  academic_year text,
  phase text, -- current phase when report was generated
  ai_draft text, -- AI generated draft
  final_content text, -- counselor-edited final version
  kpi_summary jsonb DEFAULT '[]'::jsonb, -- KPI completion data
  status text NOT NULL DEFAULT 'draft', -- 'draft', 'published'
  generated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_reports ENABLE ROW LEVEL SECURITY;

-- Counselors can manage reports for their students
CREATE POLICY "Counselors manage student reports"
  ON public.planning_reports FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM counselor_student_relationships
      WHERE counselor_id = auth.uid() AND student_id = planning_reports.student_id
    )
    OR is_admin(auth.uid())
  );

-- Students can view their own reports
CREATE POLICY "Students view own reports"
  ON public.planning_reports FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_planning_reports_updated_at
  BEFORE UPDATE ON public.planning_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();