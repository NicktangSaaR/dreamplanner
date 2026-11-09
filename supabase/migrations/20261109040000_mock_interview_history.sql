-- A record of each mock-interview run: which questions were drawn and which
-- were answered. Recordings stay in the student's browser; only this summary
-- is stored, so the student's service team can follow their practice.

create table if not exists public.mock_interview_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('simulation', 'practice')),
  title text not null default '',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'exited')),
  -- [{ key, text, type, answered, attempts }]
  questions jsonb not null default '[]'::jsonb,
  total int not null default 0,
  answered int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists mock_interview_sessions_student_idx on public.mock_interview_sessions(student_id, started_at desc);

alter table public.mock_interview_sessions enable row level security;

create policy "Students record their own interview sessions" on public.mock_interview_sessions
  for insert to authenticated with check (student_id = auth.uid());
create policy "Students update their own interview sessions" on public.mock_interview_sessions
  for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "Students, their team and admins read interview sessions" on public.mock_interview_sessions
  for select to authenticated
  using (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));

create or replace function public.touch_mock_interview_session()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists touch_mock_interview_session on public.mock_interview_sessions;
create trigger touch_mock_interview_session before update on public.mock_interview_sessions
  for each row execute function public.touch_mock_interview_session();
