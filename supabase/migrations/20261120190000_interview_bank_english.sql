-- English names for interview banks, so the setup page can show them in English.
-- Filled by AI (translate-todos, table mock_interview_questions) whenever a
-- bank's Chinese name or description is added or changed; current banks are
-- filled below.
alter table public.mock_interview_questions add column if not exists title_en text;
alter table public.mock_interview_questions add column if not exists description_en text;
-- title + newline + description the English was made from; a change re-translates.
alter table public.mock_interview_questions add column if not exists en_source text;
comment on column public.mock_interview_questions.title_en is 'English bank name (shown when the site is in English; falls back to title).';
comment on column public.mock_interview_questions.description_en is 'English description (falls back to description).';

update public.mock_interview_questions set title_en = 'MBA Interview Questions', description_en = 'Career goals and motivation, leadership, teamwork, achievements and failures, values, business thinking' where title = 'MBA 面试题';
update public.mock_interview_questions set title_en = 'MMI · Ethical Scenarios', description_en = 'Medical/health MMI: doctor–patient communication, confidentiality, resource allocation, professionalism, public-health ethics' where title = 'MMI 伦理情景类';
update public.mock_interview_questions set title_en = 'Personal Qualities', description_en = 'Strengths and weaknesses, values, motivation, how others describe you' where title = '个人品质类';
update public.mock_interview_questions set title_en = 'Personal Experiences', description_en = 'Growing up, challenges and failures, achievements, people or events that shaped you' where title = '个人经历类';
update public.mock_interview_questions set title_en = 'Health Sciences', description_en = 'Practice questions for health sciences programs (e.g. Queen''s / McMaster BHSc): motivation, health equity and social factors, medical ethics scenarios, empathy and communication, teamwork, current issues and future plans. Generated practice questions, not real past questions.' where title = '健康科学类（Health Sciences）';
update public.mock_interview_questions set title_en = 'Interests & Hobbies', description_en = 'Extracurriculars, hobbies, books, things you love doing' where title = '兴趣爱好特长类';
update public.mock_interview_questions set title_en = 'Creative Questions', description_en = 'Hypothetical, open-ended questions that test thinking on your feet' where title = '创造性问题类';
update public.mock_interview_questions set title_en = 'UofT Rotman · Business Scenario (Your View)', description_en = 'A specific business scenario; give your view (new Rotman Commerce video-interview question type)' where title = '多大 Rotman · 商业情境观点题';
update public.mock_interview_questions set title_en = 'UofT Rotman · Team Trade-off (A or B)', description_en = 'A teamwork scenario with two options; say which you''d choose and why (new Rotman Commerce video-interview question type)' where title = '多大 Rotman · 团队取舍题（A或B）';
update public.mock_interview_questions set title_en = 'UofT Engineering Q3 (Analytical)', description_en = 'UofT Engineering video interview, question 3: estimation / experiment design. Approach: give a formula or framework → name 3 variables → explain how they combine and how you''d measure them → state key assumptions.' where title = '多大工程第三题（分析题）';
update public.mock_interview_questions set title_en = 'UofT Engineering Q3 (Practice Set)', description_en = 'Practice questions modelled on UofT Engineering question 3 (not real past questions): estimation, experiment design, rate-of-change. Same approach: formula → 3 variables → combine/measure → key assumptions.' where title = '多大工程第三题（模拟题）';
update public.mock_interview_questions set title_en = 'Academic Interests', description_en = 'Favourite subjects and teachers, academic projects, competitions' where title = '学术兴趣类';
update public.mock_interview_questions set title_en = 'Teamwork Scenarios', description_en = 'Team roles, conflict, leading and persuading, situational questions' where title = '小组合作情景类';
update public.mock_interview_questions set title_en = 'Engineering Program Questions', description_en = 'Engineering interviews: self-introduction and role models, engineering fields of interest, challenges, achievements, sustainability, global issues, and experience questions on perseverance, creativity and teamwork (1 min prep, 2 min answer).' where title = '工程专业相关题';
update public.mock_interview_questions set title_en = 'Why This School / Program', description_en = 'Why this school or program, plans for university; {school} and {program} fill in automatically' where title = '择校与专业动机类';
update public.mock_interview_questions set title_en = 'Oxbridge · PPE', description_en = 'Ethics, political philosophy, democratic institutions, argument analysis (includes material-based questions)' where title = '牛剑 · PPE 哲政经';
update public.mock_interview_questions set title_en = 'Oxbridge · Motivation & Personal Statement', description_en = 'Why this subject, books and experiences from your personal statement, how you learn — tests genuine interest and independent thinking' where title = '牛剑 · 动机与个人陈述';
update public.mock_interview_questions set title_en = 'Oxbridge · Engineering', description_en = 'Mechanics, energy, structures, materials, modelling and estimation, data interpretation (includes material-based questions)' where title = '牛剑 · 工程';
update public.mock_interview_questions set title_en = 'Oxbridge · Mathematics & Computer Science', description_en = 'Proofs, estimation, probability, sketching graphs, algorithmic thinking (includes material-based questions)' where title = '牛剑 · 数学与计算机';
update public.mock_interview_questions set title_en = 'Oxbridge · Law', description_en = 'Legal reasoning, interpreting rules, hypothetical cases (includes material-based questions)' where title = '牛剑 · 法律';
update public.mock_interview_questions set title_en = 'Oxbridge · Economics & Management (E&M)', description_en = 'Economic intuition, policy trade-offs, data interpretation (includes material-based questions); no textbook knowledge needed' where title = '牛剑 · 经济与管理（E&M）';
update public.mock_interview_questions set title_en = 'Opinion Questions (UofT Interview Q3)', description_en = 'Big issues — education, economy, environment, government, fairness, technology. No specialist knowledge; tests whether you can take a clear position and back it with reasons and examples' where title = '观点表达类（多大面试第三题）';
update public.mock_interview_questions set title_en = 'Transfer Motivation', description_en = 'Why transfer, experience at your current school, plans after transferring' where title = '转学动机类';
update public.mock_interview_questions set description_en = 'Oxbridge-style academic interview: 1 motivation question + 2 subject questions (may include material), each with 2–3 follow-ups. One overall timer per question; no retakes.' where kind = 'school' and title like 'Oxford / Cambridge%' and description like '牛剑风格学术面试%';

update public.mock_interview_questions set en_source = title || chr(10) || coalesce(description, '')
 where title_en is not null or description_en is not null;

create or replace function public.request_bank_translations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ids uuid[];
  secret text;
begin
  select array_agg(id) into ids
    from new_rows
   where (title ~ '[一-鿿]' or coalesce(description, '') ~ '[一-鿿]')
     and en_source is distinct from title || chr(10) || coalesce(description, '');
  if ids is null then
    return null;
  end if;
  select (regexp_match(command, '''x-cron-secret''\s*,\s*''([^'']+)'''))[1] into secret
    from cron.job where jobname = 'dreamplanner-daily-automation';
  if secret is null then
    return null;
  end if;
  perform net.http_post(
    url := 'https://fyxnuhqzgkzfuldqurej.supabase.co/functions/v1/translate-todos',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
    body := jsonb_build_object('table', 'mock_interview_questions', 'ids', to_jsonb(ids)),
    timeout_milliseconds := 60000
  );
  return null;
exception when others then
  raise warning 'request_bank_translations: %', sqlerrm;
  return null;
end $$;

drop trigger if exists bank_translations_ins on public.mock_interview_questions;
create trigger bank_translations_ins after insert on public.mock_interview_questions
  referencing new table as new_rows for each statement execute function public.request_bank_translations();
drop trigger if exists bank_translations_upd on public.mock_interview_questions;
create trigger bank_translations_upd after update on public.mock_interview_questions
  referencing new table as new_rows for each statement execute function public.request_bank_translations();
