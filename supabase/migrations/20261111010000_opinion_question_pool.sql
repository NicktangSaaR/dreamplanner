-- Mock interview pool: opinion questions, like the third question of the
-- University of Toronto video interview. Everyday big topics (education,
-- economy, environment, government, fairness, technology); they test whether a
-- student can take a position and explain it, not subject knowledge.
-- Each one is "Do you agree or disagree with the following statement: …".
INSERT INTO public.mock_interview_questions (title, description, preparation_time, response_time, is_system, is_active, kind)
SELECT '观点表达类（多大面试第三题）',
       '教育、经济、环境、政府、公平、科技等大议题的观点题，不考专业知识，考察学生能否清楚表明立场、给出理由和例子',
       30, 60, true, true, 'pool'
 WHERE NOT EXISTS (SELECT 1 FROM public.mock_interview_questions WHERE kind = 'pool' AND title = '观点表达类（多大面试第三题）');

-- Every question is a statement to agree or disagree with.
WITH seed(ord, title) AS (VALUES
  -- Education
  (1, 'Do you agree or disagree with the following statement: University education should be free for all students.'),
  (2, 'Do you agree or disagree with the following statement: High school students should be allowed to use AI tools like ChatGPT for their homework.'),
  (3, 'Do you agree or disagree with the following statement: Schools should spend more time teaching practical life skills than traditional academic subjects.'),
  (4, 'Do you agree or disagree with the following statement: Every student should be required to learn a second language.'),
  (5, 'Do you agree or disagree with the following statement: Standardized tests are a fair way to measure a student''s ability.'),
  (6, 'Do you agree or disagree with the following statement: Online learning is just as effective as learning in a classroom.'),
  (7, 'Do you agree or disagree with the following statement: Students should take a gap year before starting university.'),
  (8, 'Do you agree or disagree with the following statement: High schools should replace letter grades with pass or fail.'),
  -- Economy
  (9, 'Do you agree or disagree with the following statement: The minimum wage should be raised significantly.'),
  (10, 'Do you agree or disagree with the following statement: Governments should give every adult a universal basic income.'),
  (11, 'Do you agree or disagree with the following statement: A four-day work week would be better for both workers and companies.'),
  (12, 'Do you agree or disagree with the following statement: Globalization has done more good than harm for ordinary people.'),
  (13, 'Do you agree or disagree with the following statement: The gig economy, such as ride-sharing and food delivery, is good for workers.'),
  (14, 'Do you agree or disagree with the following statement: Personal finance should be a required course in high school.'),
  (15, 'Do you agree or disagree with the following statement: Starting your own business after graduation is better than joining a large company.'),
  (16, 'Do you agree or disagree with the following statement: Large technology companies should pay more in taxes.'),
  -- Environment
  (17, 'Do you agree or disagree with the following statement: Single-use plastics should be banned completely.'),
  (18, 'Do you agree or disagree with the following statement: Individuals, not governments, should take the most responsibility for fighting climate change.'),
  (19, 'Do you agree or disagree with the following statement: The sale of new gasoline cars should be banned within the next ten years.'),
  (20, 'Do you agree or disagree with the following statement: Developing countries should cut their emissions as much as developed countries.'),
  (21, 'Do you agree or disagree with the following statement: Public transit should be free in big cities.'),
  (22, 'Do you agree or disagree with the following statement: Nuclear energy is a good solution to climate change.'),
  (23, 'Do you agree or disagree with the following statement: People should eat less meat to protect the environment.'),
  (24, 'Do you agree or disagree with the following statement: Economic growth is more important than protecting the environment.'),
  -- Government
  (25, 'Do you agree or disagree with the following statement: The voting age should be lowered to 16.'),
  (26, 'Do you agree or disagree with the following statement: Voting should be mandatory for all citizens.'),
  (27, 'Do you agree or disagree with the following statement: Governments should regulate social media platforms more strictly.'),
  (28, 'Do you agree or disagree with the following statement: It is acceptable for governments to monitor citizens'' online activity to keep the country safe.'),
  (29, 'Do you agree or disagree with the following statement: Governments should spend more on healthcare than on education.'),
  (30, 'Do you agree or disagree with the following statement: It is the government''s responsibility to make housing affordable.'),
  (31, 'Do you agree or disagree with the following statement: Advertising for junk food aimed at children should be banned.'),
  (32, 'Do you agree or disagree with the following statement: Countries should accept more immigrants.'),
  -- Fairness and equity
  (33, 'Do you agree or disagree with the following statement: Universities should consider an applicant''s family income in admissions.'),
  (34, 'Do you agree or disagree with the following statement: Children of alumni should not get any advantage in university admissions.'),
  (35, 'Do you agree or disagree with the following statement: Wealthy people should pay a higher tax rate than everyone else.'),
  (36, 'Do you agree or disagree with the following statement: Everyone has an equal opportunity to succeed in today''s society.'),
  (37, 'Do you agree or disagree with the following statement: Companies should be required to publish how much they pay men and women for the same job.'),
  (38, 'Do you agree or disagree with the following statement: All public buildings should be fully accessible to people with disabilities, even when it is expensive.'),
  (39, 'Do you agree or disagree with the following statement: Professional athletes and celebrities are paid too much.'),
  (40, 'Do you agree or disagree with the following statement: Schools should place students in classes by ability.'),
  -- Technology
  (41, 'Do you agree or disagree with the following statement: Artificial intelligence will create more jobs than it destroys.'),
  (42, 'Do you agree or disagree with the following statement: Children under 13 should not be allowed to own a smartphone.'),
  (43, 'Do you agree or disagree with the following statement: Self-driving cars should be allowed on public roads.'),
  (44, 'Do you agree or disagree with the following statement: Social media does more harm than good to teenagers.'),
  (45, 'Do you agree or disagree with the following statement: There should be stricter limits on how companies use our personal data.'),
  (46, 'Do you agree or disagree with the following statement: Art or writing made with AI should be allowed in student competitions.'),
  (47, 'Do you agree or disagree with the following statement: Replacing cashiers and customer service staff with machines is a good idea.'),
  (48, 'Do you agree or disagree with the following statement: Governments should solve problems on Earth before spending money on space exploration.'),
  -- Society and everyday life
  (49, 'Do you agree or disagree with the following statement: Sugary drinks should be taxed to improve public health.'),
  (50, 'Do you agree or disagree with the following statement: Growing up in a big city is better than growing up in a small town.')
)
INSERT INTO public.mock_interview_bank_questions (bank_id, title, question_type, sort_order)
SELECT p.id, s.title, 'video', s.ord
  FROM seed s JOIN public.mock_interview_questions p ON p.kind = 'pool' AND p.title = '观点表达类（多大面试第三题）'
 WHERE NOT EXISTS (SELECT 1 FROM public.mock_interview_bank_questions q WHERE q.bank_id = p.id AND q.title = s.title);
