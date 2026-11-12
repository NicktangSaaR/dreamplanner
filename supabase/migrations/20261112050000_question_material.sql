-- Material questions (Oxbridge style): a passage, data or a short problem the
-- student reads before the question appears. reading_time is in seconds.
alter table public.mock_interview_bank_questions add column if not exists material text;
alter table public.mock_interview_bank_questions add column if not exists reading_time integer;
alter table public.mock_interview_bank_questions drop constraint if exists mock_interview_bank_questions_reading_time_check;
alter table public.mock_interview_bank_questions add constraint mock_interview_bank_questions_reading_time_check
  check (reading_time is null or reading_time between 10 and 1800);
