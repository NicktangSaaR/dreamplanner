-- Application information: what students fill in once so counselors (and the
-- AI form filler) can complete Common App, Coalition, UC, OUAC,
-- EducationPlannerBC, UCAS, Hong Kong, Singapore and master's applications.
--
-- One row per student. `data` holds the answers as { section: { field: value } }.
-- Counselors mark sections as checked; if the student later changes a checked
-- section, it is flagged for another look.

create table if not exists public.application_profiles (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  applicant_type text not null default 'first_year' check (applicant_type in ('first_year','transfer','graduate')),
  systems text[] not null default '{}',
  data jsonb not null default '{}'::jsonb,
  reviews jsonb not null default '{}'::jsonb,   -- { section: { at, by, needs_review } }
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.application_profiles enable row level security;
drop policy if exists "Student and team read application info" on public.application_profiles;
drop policy if exists "Student and team add application info" on public.application_profiles;
drop policy if exists "Student and team edit application info" on public.application_profiles;
create policy "Student and team read application info" on public.application_profiles for select
  using (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));
create policy "Student and team add application info" on public.application_profiles for insert
  with check (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));
create policy "Student and team edit application info" on public.application_profiles for update
  using (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));

create or replace function public.application_profile_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  if auth.uid() = new.student_id then
    if tg_op = 'UPDATE' then
      -- students can't mark their own sections as checked
      new.reviews := old.reviews;
      for k in select jsonb_object_keys(old.reviews) loop
        if (old.reviews -> k ->> 'at') is not null and (new.data -> k) is distinct from (old.data -> k) then
          new.reviews := jsonb_set(new.reviews, array[k, 'needs_review'], 'true'::jsonb);
        end if;
      end loop;
    else
      new.reviews := '{}'::jsonb;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists application_profile_before_write on public.application_profiles;
create trigger application_profile_before_write before insert or update on public.application_profiles
  for each row execute function public.application_profile_before_write();

-- Save one section without touching the others (student and counselor may edit at the same time).
create or replace function public.save_application_section(p_student uuid, p_section text, p_value jsonb)
returns void language sql security invoker set search_path = public as $$
  update public.application_profiles
     set data = jsonb_set(data, array[p_section], coalesce(p_value, '{}'::jsonb), true)
   where student_id = p_student;
$$;

-- Counselor marks a section as checked (or unchecks it).
create or replace function public.review_application_section(p_student uuid, p_section text, p_checked boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.can_access_student_data(auth.uid(), p_student) or public.is_admin(auth.uid())) then
    raise exception 'not allowed';
  end if;
  update public.application_profiles
     set reviews = case when p_checked
       then jsonb_set(reviews, array[p_section], jsonb_build_object('at', now(), 'by', auth.uid(), 'needs_review', false), true)
       else reviews - p_section end
   where student_id = p_student;
end $$;

-- Who decides what: the counselor sets the applicant type, the systems and
-- whether to open the form early; students fill in answers only.
alter table public.application_profiles add column if not exists open_early boolean not null default false;

create or replace function public.application_profile_keep_settings() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = new.student_id and tg_op = 'UPDATE' then
    new.applicant_type := old.applicant_type;
    new.systems := old.systems;
    new.open_early := old.open_early;
  end if;
  return new;
end $$;
drop trigger if exists application_profile_keep_settings on public.application_profiles;
create trigger application_profile_keep_settings before update on public.application_profiles
  for each row execute function public.application_profile_keep_settings();

-- Students see the form once they're in the application stage, or earlier if their counselor opened it.
create or replace function public.application_info_open(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select (auth.uid() = p_student or public.can_access_student_data(auth.uid(), p_student) or public.is_admin(auth.uid()))
     and (
       exists (select 1 from public.student_phases where student_id = p_student and current_phase in ('application', 'grad_application', 'grad_admission'))
       or exists (select 1 from public.application_profiles where student_id = p_student and open_early)
     );
$$;
