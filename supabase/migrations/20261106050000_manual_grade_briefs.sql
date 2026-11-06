-- Counselors can paste a finished grade brief (written outside the system)
-- instead of uploading a report card. Such entries have no file.
ALTER TABLE public.academic_reports ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE public.academic_reports ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE public.academic_reports ALTER COLUMN mime_type DROP NOT NULL;
ALTER TABLE public.academic_reports
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'upload';
ALTER TABLE public.academic_reports DROP CONSTRAINT IF EXISTS academic_reports_source_check;
ALTER TABLE public.academic_reports
  ADD CONSTRAINT academic_reports_source_check CHECK (source IN ('upload', 'manual'));
ALTER TABLE public.academic_reports DROP CONSTRAINT IF EXISTS academic_reports_file_check;
ALTER TABLE public.academic_reports
  ADD CONSTRAINT academic_reports_file_check CHECK (source = 'manual' OR file_path IS NOT NULL);
