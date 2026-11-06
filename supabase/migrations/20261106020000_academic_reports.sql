-- Grade briefs: students (or their team) upload report cards; AI writes a
-- brief that only the counselor team can read. Counselors can ask a student
-- to upload by a due date.

CREATE TABLE IF NOT EXISTS public.academic_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  period_label text,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS academic_reports_student_idx ON public.academic_reports (student_id, created_at DESC);
ALTER TABLE public.academic_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see their own uploads"
  ON public.academic_reports FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.can_access_student_data(auth.uid(), student_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Students and their team upload report cards"
  ON public.academic_reports FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (student_id = auth.uid() OR public.can_access_student_data(auth.uid(), student_id) OR public.is_admin(auth.uid()))
  );

CREATE POLICY "Uploader or team removes a report card"
  ON public.academic_reports FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.can_access_student_data(auth.uid(), student_id) OR public.is_admin(auth.uid()));

-- The AI brief lives in its own table so students cannot read it.
CREATE TABLE IF NOT EXISTS public.academic_report_briefs (
  report_id uuid PRIMARY KEY REFERENCES public.academic_reports(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brief text,
  data jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_report_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only the counselor team reads grade briefs"
  ON public.academic_report_briefs FOR SELECT TO authenticated
  USING (public.can_access_student_data(auth.uid(), student_id) OR public.is_admin(auth.uid()));
-- Writes come only from the edge function (service role).

-- Upload requests from the team.
CREATE TABLE IF NOT EXISTS public.academic_report_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date date NOT NULL,
  message text,
  fulfilled_at timestamptz,
  overdue_notified boolean NOT NULL DEFAULT false,
  student_reminded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_report_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student and team see upload requests"
  ON public.academic_report_requests FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.can_access_student_data(auth.uid(), student_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Team cancels upload requests"
  ON public.academic_report_requests FOR DELETE TO authenticated
  USING (public.can_access_student_data(auth.uid(), student_id) OR public.is_admin(auth.uid()));
-- Requests are created and fulfilled by the edge function (it also emails the student).

-- Folder names in storage are text; turn them into a uuid safely.
CREATE OR REPLACE FUNCTION public.safe_uuid(t text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN t::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- Private storage for report cards: <student_id>/<file>
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('academic-reports', 'academic-reports', false, 15728640,
        ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Report cards: upload to own or team student folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academic-reports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.can_access_student_data(auth.uid(), public.safe_uuid((storage.foldername(name))[1]))
      OR public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Report cards: read own or team student files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'academic-reports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.can_access_student_data(auth.uid(), public.safe_uuid((storage.foldername(name))[1]))
      OR public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Report cards: delete own or team student files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'academic-reports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.can_access_student_data(auth.uid(), public.safe_uuid((storage.foldername(name))[1]))
      OR public.is_admin(auth.uid())
    )
  );
