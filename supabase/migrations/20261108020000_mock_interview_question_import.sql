-- Import the interview question collection into the shared pools.
-- Adds a 学术兴趣类 pool for academic questions (favorite subject, projects, competitions).
-- Student answers and personal notes in the source document are not imported.
-- A question is skipped if the same text (ignoring case) already exists in any pool.

INSERT INTO public.mock_interview_questions (title, description, preparation_time, response_time, is_system, is_active, kind)
SELECT '学术兴趣类', '喜欢的学科和老师、学术项目、学术竞赛', 30, 60, true, true, 'pool'
 WHERE NOT EXISTS (SELECT 1 FROM public.mock_interview_questions WHERE kind = 'pool' AND title = '学术兴趣类');

WITH src(ord, pool_title, qtype, title) AS (VALUES
  (1, '学术兴趣类', 'video', 'Can you remember a really great discussion from your English class?'),
  (2, '学术兴趣类', 'video', 'What is your favorite subject, and why?'),
  (3, '学术兴趣类', 'video', 'Who is your favorite teacher, and why?'),
  (4, '学术兴趣类', 'video', 'Is there a subject you don''t enjoy? How do you deal with it?'),
  (5, '学术兴趣类', 'video', 'Tell me about an academic project you are proud of.'),
  (6, '学术兴趣类', 'video', 'Tell me about an academic competition you took part in. What did you learn?'),
  (7, '兴趣爱好特长类', 'video', 'What do you like to write? Fiction, non-fiction, poetry?'),
  (8, '兴趣爱好特长类', 'video', 'Do you have favorite subjects you like to write about? Why?'),
  (9, '兴趣爱好特长类', 'video', 'Where do you gather your subject matter? What inspires your writing?'),
  (10, '兴趣爱好特长类', 'video', 'Have you had a chance to share your writing with an audience?'),
  (11, '兴趣爱好特长类', 'video', 'What is it about debating or politics that you enjoy?'),
  (12, '兴趣爱好特长类', 'video', 'What are your hobbies, and what do they mean to you?'),
  (13, '兴趣爱好特长类', 'video', 'What websites do you read?'),
  (14, '兴趣爱好特长类', 'video', 'What is your favorite snack?'),
  (15, '兴趣爱好特长类', 'video', 'What is your favorite movie, and why?'),
  (16, '个人品质类', 'video', 'Is there a cause that you feel particularly strong about?'),
  (17, '个人品质类', 'video', 'Talk about a time when you acted with integrity or faced a moral dilemma.'),
  (18, '个人品质类', 'video', 'Do you prefer to make plans or be spontaneous?'),
  (19, '个人品质类', 'video', 'Please tell me about a time when someone pointed out one of your personal weaknesses. How did this make you feel and what was the outcome?'),
  (20, '个人品质类', 'video', 'Please tell me about a time when you received negative critical feedback that you did not agree with. How did this make you feel and what was the outcome?'),
  (21, '个人品质类', 'video', 'Please tell me about disappointing feedback you''ve received from a teacher or mentor. How did this make you feel and what was the outcome?'),
  (22, '个人品质类', 'video', 'Please tell me about a time when you failed to follow through on a commitment you made. How did this make you feel and what was the outcome?'),
  (23, '个人品质类', 'video', 'Please tell me about a time when you overcommitted yourself to multiple activities and failed to deliver on some of them. How did this make you feel and what was the outcome?'),
  (24, '个人经历类', 'video', 'Tell me about some interesting places you have visited. Can you talk about cultural differences you observed?'),
  (25, '个人经历类', 'video', 'Has traveling influenced the way you react to your own community or home?'),
  (26, '个人经历类', 'video', 'How have your transitions affected you?'),
  (27, '个人经历类', 'video', 'What was it like adjusting to a new community or school?'),
  (28, '个人经历类', 'video', 'Tell me about something meaningful you did that brought positive change to others.'),
  (29, '个人经历类', 'video', 'Tell me about the biggest challenge you have faced.'),
  (30, '个人经历类', 'written', 'Please tell me about something important you have done, outside of the classroom. Why is this important to you and what impact does it have?'),
  (31, '个人经历类', 'written', 'Please tell me about a creative idea or project you have taken on, outside of the classroom. Why is this important to you and what impact does it have?'),
  (32, '个人经历类', 'video', 'Please tell me about a disappointing mark you''ve ever received on a project. How did this make you feel and what was the outcome?'),
  (33, '小组合作情景类', 'video', 'Tell me about your leadership experience.'),
  (34, '小组合作情景类', 'video', 'Have you ever struggled to communicate with others while working together on a project?'),
  (35, '小组合作情景类', 'video', 'Can you share an example of a situation in which teamwork enhanced your output?'),
  (36, '小组合作情景类', 'video', 'What is your idea of an ideal team-building exercise?'),
  (37, '小组合作情景类', 'video', 'What type of support does a team need to function as efficiently as possible?'),
  (38, '小组合作情景类', 'video', 'Do you prefer working on your own or as part of a team? How do you feel about working on a team?'),
  (39, '小组合作情景类', 'video', 'Tell me about a time you worked well as part of a team.'),
  (40, '小组合作情景类', 'video', 'Have you ever had difficulty working with a leader or other team members?'),
  (41, '小组合作情景类', 'video', 'Tell me about a challenging situation in a team that you had to deal with.'),
  (42, '小组合作情景类', 'video', 'What strategies would you use to motivate your team?'),
  (43, '小组合作情景类', 'video', 'What would you contribute to the team culture?'),
  (44, '小组合作情景类', 'video', 'How would you handle it if there was a problem with a member of your team not doing their fair share of work?'),
  (45, '小组合作情景类', 'video', 'Give an example of a successful project that you were part of. What was your role? What made the project successful in your view?'),
  (46, '小组合作情景类', 'video', 'Describe a situation in which you decided a team was the best way to solve a problem or make a change. How did the team work out? Was it the correct decision in retrospect?'),
  (47, '小组合作情景类', 'video', 'What actions and support, in your experience, make a team function successfully?'),
  (48, '小组合作情景类', 'video', 'Can you share an example of a situation in which teamwork helped you accomplish your goals?'),
  (49, '小组合作情景类', 'video', 'Share a time when you worked with a difficult teammate. How was the teammate difficult and what did you do to resolve the situation and keep the team moving?'),
  (50, '小组合作情景类', 'video', 'Do you feel more energized when you are working alone or when you are working as part of a team?'),
  (51, '小组合作情景类', 'video', 'Describe the level of interaction with teammates in which you would be most successful.'),
  (52, '小组合作情景类', 'video', 'Give me an example of a time when your group worked especially well with another group to accomplish a goal.'),
  (53, '小组合作情景类', 'video', 'Have you been a member of a team that struggled or failed to accomplish its goal? If so, what do you think were the reasons for the failure?'),
  (54, '小组合作情景类', 'video', 'Tell me about the most rewarding experience you have had working in a team. What made it so rewarding?'),
  (55, '小组合作情景类', 'video', 'Give an example of when your team motivated you. How did this enhance your performance?'),
  (56, '小组合作情景类', 'video', 'Tell me about a time when communication became an issue during a team project.'),
  (57, '小组合作情景类', 'video', 'What qualities do you believe are most valuable for a team lead to possess?'),
  (58, '小组合作情景类', 'video', 'Have you ever had to adapt your working style to fit team objectives?'),
  (59, '小组合作情景类', 'video', 'When have you been on a team project that failed? What did you learn from that experience?'),
  (60, '小组合作情景类', 'video', 'When was the last time you contributed to a team effort and what was your role?'),
  (61, '小组合作情景类', 'video', 'How do you make tough decisions knowing they will affect your entire team?'),
  (62, '小组合作情景类', 'video', 'Tell me about a time when you accomplished a team goal. Why do you think your team was successful?'),
  (63, '小组合作情景类', 'video', 'Tell me about a time there was a serious conflict on your team. How did you resolve it?'),
  (64, '小组合作情景类', 'video', 'Tell me about a time when you led a team. What was your biggest success factor?'),
  (65, '小组合作情景类', 'video', 'Do you think it is possible to be a good team member, yet disagree with the leader?'),
  (66, '小组合作情景类', 'video', 'Tell me about the type of team members you dislike working with.'),
  (67, '小组合作情景类', 'video', 'Please tell me about a time when you worked in a team environment with individuals who had difficulty collaborating. What did you do and how did the team react?'),
  (68, '小组合作情景类', 'video', 'Please tell me about a time when you worked in a team environment and one team member was treating another with disrespect. What did you do and how did the team react?'),
  (69, '小组合作情景类', 'video', 'Please tell me about a time when you worked in a team environment and one individual tried to assume leadership and started dictating to the rest of the team. What did you do and how did the team react?'),
  (70, '小组合作情景类', 'video', 'Please tell me about a time when you worked in a team environment that included two team members who did not get along with each other. What did you do and how did the team react?'),
  (71, '小组合作情景类', 'video', 'Please tell me about a time when you worked in a team environment and one team member was shy and felt uncomfortable voicing their opinion. What did you do and how did the team react?'),
  (72, '小组合作情景类', 'video', 'Please tell me about a time when you worked in a team environment with individuals who had diverse personality types. What did you do and how did the team react?'),
  (73, '创造性问题类', 'video', 'What do you think it means to have an ''entrepreneurial spirit''? Please explain your opinion in detail.'),
  (74, '创造性问题类', 'video', 'Do you think it''s important to take risks sometimes? Please explain your opinion in detail.'),
  (75, '创造性问题类', 'video', 'Why do you think many people value the attribute of ''thinking outside of the box'' in others? Please explain your opinion in detail.'),
  (76, '创造性问题类', 'video', 'Do you think it''s important to be outside of your comfort zone sometimes? Please explain your opinion in detail.'),
  (77, '创造性问题类', 'video', 'Who is somebody that you consider a creative problem solver? Please explain your opinion in detail.'),
  (78, '创造性问题类', 'video', 'What circumstances make it okay to take a risk versus playing it safe? Please explain your opinion in detail.'),
  (79, '创造性问题类', 'video', 'If you were a dessert, what dessert would you be?'),
  (80, '创造性问题类', 'video', 'What is your usual order at a diner?'),
  (81, '创造性问题类', 'video', 'What was the last gift you gave someone?'),
  (82, '创造性问题类', 'video', 'Which superpowers would you choose?'),
  (83, '创造性问题类', 'video', 'If you were an animal, what would you be?'),
  (84, '创造性问题类', 'video', 'Would you rather have a personal chef or a personal trainer?'),
  (85, '创造性问题类', 'video', 'What would you title your autobiography?'),
  (86, '创造性问题类', 'video', 'Would you rather be a wedding cake or a fortune cookie?'),
  (87, '创造性问题类', 'video', 'If you could live anywhere, where would you choose?'),
  (88, '创造性问题类', 'video', 'If your life had a theme song, what would it be?'),
  (89, '创造性问题类', 'video', 'If you could teach a course at a university, what would it be and why?'),
  (90, '择校与专业动机类', 'video', 'Why do you want to study in the United States?'),
  (91, '择校与专业动机类', 'video', 'Why did you choose your intended major?'),
  (92, '择校与专业动机类', 'video', 'What are your plans for the future?')
),
fresh AS (
  SELECT s.*, p.id AS bank_id
    FROM src s
    JOIN public.mock_interview_questions p ON p.kind = 'pool' AND p.title = s.pool_title
   WHERE NOT EXISTS (
     SELECT 1 FROM public.mock_interview_bank_questions q
       JOIN public.mock_interview_questions b ON b.id = q.bank_id AND b.kind = 'pool'
      WHERE lower(trim(q.title)) = lower(s.title))
)
INSERT INTO public.mock_interview_bank_questions (bank_id, title, question_type, sort_order)
SELECT f.bank_id, f.title, f.qtype,
       coalesce((SELECT max(sort_order) FROM public.mock_interview_bank_questions WHERE bank_id = f.bank_id), 0)
         + row_number() OVER (PARTITION BY f.bank_id ORDER BY f.ord)
  FROM fresh f;
