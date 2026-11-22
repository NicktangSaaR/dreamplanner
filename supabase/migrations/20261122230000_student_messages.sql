-- Messages a counselor sends a student from the site; delivered by email
-- (send-student-message). The student's team, admins and the student can read them.
create table if not exists public.student_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  subject text,
  body text not null,
  cc_parent boolean not null default false,
  emailed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists student_messages_student_idx on public.student_messages (student_id, created_at desc);

alter table public.student_messages enable row level security;

drop policy if exists "Team, admins and the student read messages" on public.student_messages;
create policy "Team, admins and the student read messages" on public.student_messages
  for select to authenticated
  using (
    student_id = auth.uid()
    or public.can_access_student_data(auth.uid(), student_id)
    or public.is_admin(auth.uid())
  );

grant select on public.student_messages to authenticated;
