-- Kira-style mock interview (2026-11-04)
--
-- mock_interview_questions        = question BANKS (managed by admins)
-- mock_interview_bank_questions   = questions inside a bank
-- mock_interview_custom_questions = a student's own questions (new)
--
-- Also fixes a hole: any signed-in user could insert/update/delete questions
-- in system banks ("Users can manage bank questions").

-- ---------------------------------------------------------------- banks ---
ALTER TABLE public.mock_interview_questions
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS program text;

COMMENT ON COLUMN public.mock_interview_questions.is_active IS 'Students only see active banks';
COMMENT ON COLUMN public.mock_interview_questions.school IS 'Replaces {school} in question text';
COMMENT ON COLUMN public.mock_interview_questions.program IS 'Replaces {program} in question text';

-- ------------------------------------------------------------ questions ---
ALTER TABLE public.mock_interview_bank_questions
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS preparation_time integer,
  ADD COLUMN IF NOT EXISTS response_time integer,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.mock_interview_bank_questions
    ADD CONSTRAINT bank_question_type_check CHECK (question_type IN ('video', 'written'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.mock_interview_bank_questions
    ADD CONSTRAINT bank_question_times_check CHECK (
      (preparation_time IS NULL OR preparation_time BETWEEN 0 AND 900) AND
      (response_time IS NULL OR response_time BETWEEN 10 AND 1800));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- keep the existing question order stable
UPDATE public.mock_interview_bank_questions b
SET sort_order = s.rn
FROM (SELECT id, row_number() OVER (PARTITION BY bank_id ORDER BY created_at, id) AS rn
      FROM public.mock_interview_bank_questions) s
WHERE s.id = b.id AND b.sort_order = 0;

-- ------------------------------------------------- bank + question RLS ---
DROP POLICY IF EXISTS "Users can view all questions" ON public.mock_interview_questions;
DROP POLICY IF EXISTS "Users can insert their own questions" ON public.mock_interview_questions;
DROP POLICY IF EXISTS "Users can update their own questions" ON public.mock_interview_questions;
DROP POLICY IF EXISTS "Users can delete their own questions" ON public.mock_interview_questions;
DROP POLICY IF EXISTS "Admins can delete any question bank" ON public.mock_interview_questions;

CREATE POLICY "Signed-in users see active banks; admins see all"
  ON public.mock_interview_questions FOR SELECT TO authenticated
  USING (is_active OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage banks"
  ON public.mock_interview_questions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage bank questions" ON public.mock_interview_bank_questions;
DROP POLICY IF EXISTS "Users can view all bank questions" ON public.mock_interview_bank_questions;

CREATE POLICY "Signed-in users see questions of active banks; admins see all"
  ON public.mock_interview_bank_questions FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.mock_interview_questions b
      WHERE b.id = mock_interview_bank_questions.bank_id AND b.is_active)
  );
CREATE POLICY "Admins manage bank questions"
  ON public.mock_interview_bank_questions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ------------------------------------------------- custom questions -------
CREATE TABLE IF NOT EXISTS public.mock_interview_custom_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 1000),
  question_type text NOT NULL DEFAULT 'video' CHECK (question_type IN ('video', 'written')),
  preparation_time integer NOT NULL DEFAULT 30 CHECK (preparation_time BETWEEN 0 AND 900),
  response_time integer NOT NULL DEFAULT 60 CHECK (response_time BETWEEN 10 AND 1800),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mock_interview_custom_questions_user_idx
  ON public.mock_interview_custom_questions (user_id, created_at);

ALTER TABLE public.mock_interview_custom_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner, their counselors and admins can view custom questions"
  ON public.mock_interview_custom_questions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR public.can_access_student_data(auth.uid(), user_id)
  );
CREATE POLICY "Owner adds custom questions"
  ON public.mock_interview_custom_questions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner edits custom questions"
  ON public.mock_interview_custom_questions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner deletes custom questions"
  ON public.mock_interview_custom_questions FOR DELETE TO authenticated
  USING (user_id = auth.uid());
