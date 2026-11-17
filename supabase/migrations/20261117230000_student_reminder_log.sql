-- When a student was last reminded (to-do reminder email, activity-portfolio request).
-- Written by the edge functions with the service role; the student's team can read it.
create table if not exists public.student_reminder_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('todo', 'activity')),
  sent_by uuid references public.profiles(id) on delete set null,
  emailed boolean not null default true,
  sent_at timestamptz not null default now()
);
create index if not exists student_reminder_log_student_kind_idx
  on public.student_reminder_log (student_id, kind, sent_at desc);

alter table public.student_reminder_log enable row level security;

drop policy if exists "Team reads reminder log" on public.student_reminder_log;
create policy "Team reads reminder log" on public.student_reminder_log
  for select to authenticated
  using (public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));

grant select on public.student_reminder_log to authenticated;
