-- Full simulations: each question bank (a university + program) can be
-- offered as a real-conditions mock interview with settings the admin
-- chooses. Students cannot change these settings in simulation mode.
ALTER TABLE public.mock_interview_questions
  ADD COLUMN IF NOT EXISTS sim_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sim_question_count integer,          -- null = all questions
  ADD COLUMN IF NOT EXISTS sim_shuffle boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sim_retakes integer NOT NULL DEFAULT 0;

ALTER TABLE public.mock_interview_questions DROP CONSTRAINT IF EXISTS mock_interview_questions_sim_check;
ALTER TABLE public.mock_interview_questions ADD CONSTRAINT mock_interview_questions_sim_check
  CHECK ((sim_question_count IS NULL OR sim_question_count BETWEEN 1 AND 50) AND sim_retakes IN (0, 1, 2, 99));
