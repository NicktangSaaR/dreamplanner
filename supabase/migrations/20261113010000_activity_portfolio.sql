-- Activity portfolio: the student's activities, awards, competitions, research,
-- work, volunteering and programmes, kept up to date from the planning stage
-- and used for applications (Common App, UC, résumé, brag sheets).
--
-- Students fill a short form (name, type, dates, hours, a note); counselors
-- fill in the rest and mark entries as checked. A student edit to a checked
-- entry flags it for another look. Every change is kept in activity_history.

alter table public.extracurricular_activities
  add column if not exists category text not null default 'activity',
  add column if not exists status text not null default 'ongoing',
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists hours_per_week numeric(5,1),
  add column if not exists weeks_per_year smallint,
  add column if not exists timing text,
  add column if not exists organization text,
  add column if not exists level text,
  add column if not exists description_en text,
  add column if not exists ca_text text,
  add column if not exists uc_text text,
  add column if not exists name_en text,
  add column if not exists ca_type text,
  add column if not exists uc_category text,
  add column if not exists evidence_url text,
  add column if not exists continue_in_college boolean,
  add column if not exists sort_order integer not null default 0,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists needs_review boolean not null default false,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table public.extracurricular_activities
  drop constraint if exists extracurricular_activities_category_check,
  drop constraint if exists extracurricular_activities_status_check,
  drop constraint if exists extracurricular_activities_timing_check,
  drop constraint if exists extracurricular_activities_level_check,
  drop constraint if exists extracurricular_activities_hours_check,
  drop constraint if exists extracurricular_activities_weeks_check;
alter table public.extracurricular_activities
  add constraint extracurricular_activities_category_check
    check (category in ('activity','honor','competition','research','work','volunteer','program')),
  add constraint extracurricular_activities_status_check check (status in ('planned','ongoing','ended')),
  add constraint extracurricular_activities_timing_check check (timing is null or timing in ('school','break','all_year')),
  add constraint extracurricular_activities_level_check
    check (level is null or level in ('school','regional','provincial','national','international')),
  add constraint extracurricular_activities_hours_check check (hours_per_week is null or hours_per_week between 0 and 168),
  add constraint extracurricular_activities_weeks_check check (weeks_per_year is null or weeks_per_year between 0 and 52);

create index if not exists extracurricular_activities_student_idx
  on public.extracurricular_activities (student_id, sort_order);

-- Access: the student, their counselors and collaborators, admins.
-- (Replaces older rules that let any counselor see every student's activities.)
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'extracurricular_activities' loop
    execute format('drop policy %I on public.extracurricular_activities', p.policyname);
  end loop;
end $$;
alter table public.extracurricular_activities enable row level security;
create policy "Student and team read activities" on public.extracurricular_activities for select
  using (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));
create policy "Student and team add activities" on public.extracurricular_activities for insert
  with check (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));
create policy "Student and team edit activities" on public.extracurricular_activities for update
  using (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));
create policy "Student and team delete activities" on public.extracurricular_activities for delete
  using (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));

-- Who changed it; a student's change to a checked entry needs another look.
create or replace function public.activity_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  new.updated_at := now();
  if tg_op = 'UPDATE' and auth.uid() = new.student_id then
    -- students can't mark their own entries as checked
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
    if old.reviewed_at is not null and (
         new.name is distinct from old.name or new.role is distinct from old.role
      or new.description is distinct from old.description or new.category is distinct from old.category
      or new.status is distinct from old.status or new.start_date is distinct from old.start_date
      or new.end_date is distinct from old.end_date or new.hours_per_week is distinct from old.hours_per_week
      or new.organization is distinct from old.organization or new.evidence_url is distinct from old.evidence_url) then
      new.needs_review := true;
    else
      new.needs_review := old.needs_review;
    end if;
  elsif tg_op = 'INSERT' and auth.uid() = new.student_id then
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.needs_review := false;
  end if;
  return new;
end $$;
drop trigger if exists activity_before_write on public.extracurricular_activities;
create trigger activity_before_write before insert or update on public.extracurricular_activities
  for each row execute function public.activity_before_write();

create table if not exists public.activity_history (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null,
  student_id uuid not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  action text not null check (action in ('added','changed','deleted')),
  before jsonb,
  after jsonb
);
create index if not exists activity_history_student_idx on public.activity_history (student_id, changed_at desc);
alter table public.activity_history enable row level security;
drop policy if exists "Student and team read activity history" on public.activity_history;
create policy "Student and team read activity history" on public.activity_history for select
  using (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));

create or replace function public.activity_after_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare skip text[] := array['updated_at','updated_by','sort_order','needs_review','reviewed_at','reviewed_by'];
begin
  if tg_op = 'INSERT' then
    insert into activity_history (activity_id, student_id, changed_by, action, after)
    values (new.id, new.student_id, auth.uid(), 'added', to_jsonb(new));
  elsif tg_op = 'DELETE' then
    insert into activity_history (activity_id, student_id, changed_by, action, before)
    values (old.id, old.student_id, auth.uid(), 'deleted', to_jsonb(old));
  elsif (to_jsonb(new) - skip) is distinct from (to_jsonb(old) - skip) then
    insert into activity_history (activity_id, student_id, changed_by, action, before, after)
    values (new.id, new.student_id, auth.uid(), 'changed', to_jsonb(old) - skip, to_jsonb(new) - skip);
  end if;
  return null;
end $$;
drop trigger if exists activity_after_write on public.extracurricular_activities;
create trigger activity_after_write after insert or update or delete on public.extracurricular_activities
  for each row execute function public.activity_after_write();

-- Existing entries: keep them, order them by when they were added.
update public.extracurricular_activities a set sort_order = s.n
from (select id, row_number() over (partition by student_id order by created_at) n from public.extracurricular_activities) s
where s.id = a.id and a.sort_order = 0;
