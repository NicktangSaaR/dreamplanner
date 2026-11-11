-- Mock interview pool: opinion questions, like the third question of the
-- University of Toronto video interview. Everyday big topics (education,
-- economy, environment, government, fairness, technology); they test whether a
-- student can take a position and explain it, not subject knowledge.
INSERT INTO public.mock_interview_questions (title, description, preparation_time, response_time, is_system, is_active, kind)
SELECT '观点表达类（多大面试第三题）',
       '教育、经济、环境、政府、公平、科技等大议题的观点题，不考专业知识，考察学生能否清楚表明立场、给出理由和例子',
       30, 60, true, true, 'pool'
 WHERE NOT EXISTS (SELECT 1 FROM public.mock_interview_questions WHERE kind = 'pool' AND title = '观点表达类（多大面试第三题）');

WITH seed(ord, title) AS (VALUES
  -- Education
  (1,  'Should university education be free for all students? Why or why not?'),
  (2,  'Should high school students be allowed to use AI tools like ChatGPT for their homework?'),
  (3,  'Is it more important for schools to teach practical life skills or traditional academic subjects?'),
  (4,  'Should every student be required to learn a second language?'),
  (5,  'Do standardized tests fairly measure a student''s ability?'),
  (6,  'Is online learning as effective as learning in a classroom?'),
  (7,  'Should students take a gap year before starting university?'),
  (8,  'Should high schools replace letter grades with pass or fail?'),
  -- Economy
  (9,  'Should the minimum wage be raised significantly?'),
  (10, 'Should governments give every adult a universal basic income?'),
  (11, 'Do you think a four-day work week is a good idea?'),
  (12, 'Has globalization done more good or more harm for ordinary people?'),
  (13, 'Is the gig economy, such as ride-sharing and food delivery, good for workers?'),
  (14, 'Should personal finance and investing be a required course in high school?'),
  (15, 'After graduating, is it better to join a large company or start your own business?'),
  (16, 'Should large technology companies pay more in taxes?'),
  -- Environment
  (17, 'Should single-use plastics be banned completely?'),
  (18, 'Who should take the most responsibility for fighting climate change: governments, companies or individuals?'),
  (19, 'Should the sale of new gasoline cars be banned within the next ten years?'),
  (20, 'Is it fair to ask developing countries to cut emissions as much as developed countries?'),
  (21, 'Should public transit be free in big cities to reduce car use?'),
  (22, 'Is nuclear energy a good solution to climate change?'),
  (23, 'Should people eat less meat to protect the environment?'),
  (24, 'Is economic growth more important than protecting the environment?'),
  -- Government
  (25, 'Should the voting age be lowered to 16?'),
  (26, 'Should voting be mandatory for all citizens?'),
  (27, 'Should governments regulate social media platforms more strictly?'),
  (28, 'How much should a government be allowed to monitor its citizens to keep them safe?'),
  (29, 'If a government had extra money, should it spend it on healthcare or on education?'),
  (30, 'Is it the government''s responsibility to make housing affordable?'),
  (31, 'Should advertising for junk food aimed at children be banned?'),
  (32, 'Should countries accept more immigrants?'),
  -- Fairness and equity
  (33, 'Should universities consider an applicant''s family background or income in admissions?'),
  (34, 'Is it fair for children of alumni to get an advantage in university admissions?'),
  (35, 'Should wealthy people pay a higher tax rate than everyone else?'),
  (36, 'Does everyone have an equal opportunity to succeed in today''s society?'),
  (37, 'Should companies be required to publish how much they pay men and women for the same job?'),
  (38, 'Should all public buildings be fully accessible to people with disabilities, even when it is expensive?'),
  (39, 'Are professional athletes and celebrities paid too much?'),
  (40, 'Is it fair for schools to place students in classes by ability?'),
  -- Technology
  (41, 'Will artificial intelligence create more jobs than it destroys?'),
  (42, 'Should children under 13 be allowed to own a smartphone?'),
  (43, 'Should self-driving cars be allowed on public roads?'),
  (44, 'Is social media doing more good or more harm to teenagers?'),
  (45, 'Should there be stricter limits on how companies use our personal data?'),
  (46, 'Should art or writing made with AI be allowed in student competitions?'),
  (47, 'Is it a good idea to replace cashiers and customer service staff with machines?'),
  (48, 'Should we spend money on space exploration, or solve problems on Earth first?'),
  -- Society and everyday life
  (49, 'Should sugary drinks be taxed to improve public health?'),
  (50, 'Is it better to grow up in a big city or a small town?')
)
INSERT INTO public.mock_interview_bank_questions (bank_id, title, question_type, sort_order)
SELECT p.id, s.title, 'video', s.ord
  FROM seed s JOIN public.mock_interview_questions p ON p.kind = 'pool' AND p.title = '观点表达类（多大面试第三题）'
 WHERE NOT EXISTS (SELECT 1 FROM public.mock_interview_bank_questions q WHERE q.bank_id = p.id AND q.title = s.title);
