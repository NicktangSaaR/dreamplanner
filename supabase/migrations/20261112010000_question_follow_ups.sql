-- Follow-up questions (Oxbridge-style interviews). Each element is one
-- follow-up position with one or more wordings; one wording per position is
-- picked at random when the question is asked, after the main answer.
-- e.g. [["If interest rates rose, what would happen?", "What about an ageing population?"], ["Can you think of a counterexample?"]]
alter table public.mock_interview_bank_questions
  add column if not exists follow_ups jsonb not null default '[]'::jsonb;
alter table public.mock_interview_bank_questions
  drop constraint if exists mock_interview_bank_questions_follow_ups_array;
alter table public.mock_interview_bank_questions
  add constraint mock_interview_bank_questions_follow_ups_array check (jsonb_typeof(follow_ups) = 'array');
