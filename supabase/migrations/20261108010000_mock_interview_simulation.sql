-- Mock interview: shared question pools + per-school interview blueprints.
--
-- mock_interview_questions now holds two kinds of rows:
--   kind = 'pool'   a shared question category (个人经历类, 创造性问题类 …)
--                   whose questions live in mock_interview_bank_questions.
--   kind = 'school' a university/program interview. It has no questions of
--                   its own; its blueprint says how many questions to draw
--                   from which pools, with what type and timing.
-- Blueprint item: {"pool_id": uuid, "count": int, "question_type": "video"|"written"|null,
--                  "prep": seconds, "response": seconds}

ALTER TABLE public.mock_interview_questions
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'pool',
  ADD COLUMN IF NOT EXISTS blueprint jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sim_shuffle boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sim_retakes integer NOT NULL DEFAULT 0;

ALTER TABLE public.mock_interview_questions DROP CONSTRAINT IF EXISTS mock_interview_questions_kind_check;
ALTER TABLE public.mock_interview_questions ADD CONSTRAINT mock_interview_questions_kind_check
  CHECK (kind IN ('pool', 'school') AND jsonb_typeof(blueprint) = 'array' AND sim_retakes IN (0, 1, 2, 99));

-- Existing university-named banks become school interviews (blueprint to be set by the admin).
UPDATE public.mock_interview_questions
   SET kind = 'school'
 WHERE title IN ('McMaster University Engineering Questions', 'UofT Engineering Questions',
                 'UofT Rotman Interview Questions', 'UBC Sauder Interview Questions',
                 'InitialView Interview Questions', 'Oxbridge Interview Questions',
                 'US College Alumni Interview Questions')
   AND NOT EXISTS (SELECT 1 FROM public.mock_interview_bank_questions q WHERE q.bank_id = mock_interview_questions.id);

UPDATE public.mock_interview_questions SET school = 'McMaster University', program = 'Engineering' WHERE title = 'McMaster University Engineering Questions' AND school IS NULL;
UPDATE public.mock_interview_questions SET school = 'University of Toronto', program = 'Engineering' WHERE title = 'UofT Engineering Questions' AND school IS NULL;
UPDATE public.mock_interview_questions SET school = 'University of Toronto', program = 'Rotman Commerce' WHERE title = 'UofT Rotman Interview Questions' AND school IS NULL;
UPDATE public.mock_interview_questions SET school = 'UBC', program = 'Sauder School of Business' WHERE title = 'UBC Sauder Interview Questions' AND school IS NULL;

-- The six shared pools.
INSERT INTO public.mock_interview_questions (title, description, preparation_time, response_time, is_system, is_active, kind)
SELECT c.title, c.description, 30, 60, true, true, 'pool'
  FROM (VALUES
    (1, '个人经历类',       '成长经历、挑战与失败、成就、影响你的人或事'),
    (2, '兴趣爱好特长类',   '课外活动、爱好、书、热爱的事'),
    (3, '个人品质类',       '优缺点、价值观、动力、别人如何评价你'),
    (4, '小组合作情景类',   '团队角色、冲突、领导与说服、情景题'),
    (5, '创造性问题类',     '假设性、开放性的问题，考察临场思考'),
    (6, '择校与专业动机类', 'Why this school / program、大学规划；可用 {school} {program} 占位')
  ) AS c(ord, title, description)
 WHERE NOT EXISTS (SELECT 1 FROM public.mock_interview_questions x WHERE x.kind = 'pool' AND x.title = c.title)
 ORDER BY c.ord;

-- Sort the 35 general questions into the pools (matched by their original number),
-- and strip the leading "12.\t" numbering from their text.
WITH general AS (
  SELECT id FROM public.mock_interview_questions WHERE title = 'General Interview Questions' LIMIT 1
),
mapping(num, pool_title) AS (VALUES
  (29,'个人经历类'),(6,'个人经历类'),(34,'个人经历类'),(12,'个人经历类'),(1,'个人经历类'),(11,'个人经历类'),
  (26,'个人经历类'),(16,'个人经历类'),(15,'个人经历类'),(8,'个人经历类'),(23,'个人经历类'),
  (14,'兴趣爱好特长类'),(35,'兴趣爱好特长类'),(33,'兴趣爱好特长类'),(28,'兴趣爱好特长类'),
  (5,'个人品质类'),(30,'个人品质类'),(31,'个人品质类'),(3,'个人品质类'),(27,'个人品质类'),(19,'个人品质类'),
  (18,'个人品质类'),(22,'个人品质类'),(32,'个人品质类'),(25,'个人品质类'),
  (4,'小组合作情景类'),(2,'小组合作情景类'),(7,'小组合作情景类'),
  (17,'创造性问题类'),(24,'创造性问题类'),(10,'创造性问题类'),(9,'创造性问题类'),
  (20,'择校与专业动机类'),(21,'择校与专业动机类'),(13,'择校与专业动机类')
)
UPDATE public.mock_interview_bank_questions q
   SET bank_id = p.id,
       title = trim(regexp_replace(q.title, '^\s*\d+\.\s*', '')),
       updated_at = now()
  FROM general g, mapping m, public.mock_interview_questions p
 WHERE q.bank_id = g.id
   AND substring(q.title from '^\s*(\d+)\.')::int = m.num
   AND p.kind = 'pool' AND p.title = m.pool_title;

-- Starter questions so every pool has enough to draw from.
WITH seed(pool_title, title) AS (VALUES
  ('创造性问题类', 'If you had the ability to travel back in time, when would you travel to and why?'),
  ('创造性问题类', 'If you could add one course that every high school student must take, what would it be?'),
  ('创造性问题类', 'If you could solve one problem in your city with unlimited resources, what would you choose?'),
  ('创造性问题类', 'Describe an object in this room as if it were the most important invention in history.'),
  ('创造性问题类', 'If you could have dinner with any three people, past or present, who would they be?'),
  ('小组合作情景类', 'You are working on a group project and one member is not contributing. What do you do?'),
  ('小组合作情景类', 'Tell us about a time you had to work with someone whose style was very different from yours.'),
  ('小组合作情景类', 'Your team disagrees on the direction of a project two days before the deadline. How do you handle it?'),
  ('小组合作情景类', 'Describe a time you took the lead when nobody else would.'),
  ('兴趣爱好特长类', 'What do you do outside of school that you would keep doing even if nobody noticed?'),
  ('兴趣爱好特长类', 'Teach us something you know well in under a minute.'),
  ('兴趣爱好特长类', 'Tell us about a skill you taught yourself. How did you go about it?'),
  ('择校与专业动机类', 'Why do you want to study {program} at {school}?'),
  ('择校与专业动机类', 'What will you contribute to the {school} community?'),
  ('择校与专业动机类', 'Where do you see yourself five years after graduating from {program}?')
)
INSERT INTO public.mock_interview_bank_questions (bank_id, title, question_type, sort_order)
SELECT p.id, s.title, 'video', 100 + row_number() OVER ()
  FROM seed s JOIN public.mock_interview_questions p ON p.kind = 'pool' AND p.title = s.pool_title
 WHERE NOT EXISTS (SELECT 1 FROM public.mock_interview_bank_questions q WHERE q.bank_id = p.id AND q.title = s.title);

-- The emptied general bank is kept (old practice records point to it) but hidden.
UPDATE public.mock_interview_questions SET is_active = false
 WHERE title = 'General Interview Questions'
   AND NOT EXISTS (SELECT 1 FROM public.mock_interview_bank_questions q WHERE q.bank_id = mock_interview_questions.id);

-- Two old empty single-question banks are hidden too (the admin can delete them).
UPDATE public.mock_interview_questions SET is_active = false
 WHERE kind = 'pool' AND title IN ('Describe a challenge you overcame', 'What are your academic goals?')
   AND NOT EXISTS (SELECT 1 FROM public.mock_interview_bank_questions q WHERE q.bank_id = mock_interview_questions.id);
