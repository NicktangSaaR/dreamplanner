-- Mock interview access. On by default for every student; an admin can turn it
-- off for a student by hand. Counselors and admins can always use it.

alter table public.profiles
  add column if not exists mock_interview_enabled boolean not null default true;
comment on column public.profiles.mock_interview_enabled is
  'Student may use the mock interview (default on; an admin can turn it off). Counselors and admins always may.';

create or replace function public.can_use_mock_interview(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select user_type in ('admin', 'counselor') or mock_interview_enabled from profiles where id = uid),
    false
  );
$$;
revoke all on function public.can_use_mock_interview(uuid) from public, anon;
grant execute on function public.can_use_mock_interview(uuid) to authenticated;

-- Question banks: only people who may use the interview can read them.
drop policy if exists "Signed-in users see active banks; admins see all" on public.mock_interview_questions;
create policy "Interview users see active banks; admins see all" on public.mock_interview_questions
  for select to authenticated
  using (public.is_admin(auth.uid()) or (is_active and public.can_use_mock_interview(auth.uid())));

drop policy if exists "Signed-in users see questions of active banks; admins see all" on public.mock_interview_bank_questions;
create policy "Interview users see questions of active banks; admins see all" on public.mock_interview_bank_questions
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or (
      public.can_use_mock_interview(auth.uid())
      and exists (select 1 from public.mock_interview_questions b where b.id = bank_id and b.is_active)
    )
  );

-- Starting a run or adding one's own questions also needs access.
drop policy if exists "Students record their own interview sessions" on public.mock_interview_sessions;
create policy "Students record their own interview sessions" on public.mock_interview_sessions
  for insert to authenticated
  with check (student_id = auth.uid() and public.can_use_mock_interview(auth.uid()));

drop policy if exists "Owner adds custom questions" on public.mock_interview_custom_questions;
create policy "Owner adds custom questions" on public.mock_interview_custom_questions
  for insert to authenticated
  with check (user_id = auth.uid() and public.can_use_mock_interview(auth.uid()));

-- Only admins can change the switch.
create or replace function public.protect_profile_privileged_fields()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  -- auth.role() comes from the request JWT. API traffic always carries one
  -- ('anon', 'authenticated' or 'service_role'); an empty role means a direct
  -- database connection (migrations, SQL editor, the auth service's signup
  -- trigger), which is trusted.
  jwt_role text := coalesce(auth.role(), '');
  privileged boolean :=
       jwt_role in ('', 'service_role')
    or coalesce(public.is_admin(auth.uid()), false);
begin
  if privileged then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.user_type is null or new.user_type not in ('student', 'counselor') then
      new.user_type := 'student';
    end if;
    new.is_verified := false;
    new.username := null;
    new.mock_interview_enabled := true;
    return new;
  end if;

  if new.user_type is distinct from old.user_type
     or new.is_verified is distinct from old.is_verified then
    raise exception 'Only administrators can change user_type or is_verified'
      using errcode = '42501';
  end if;
  if new.username is distinct from old.username then
    raise exception 'Only administrators can change a username'
      using errcode = '42501';
  end if;
  if new.mock_interview_enabled is distinct from old.mock_interview_enabled then
    raise exception 'Only administrators can change mock interview access'
      using errcode = '42501';
  end if;
  return new;
end;
$function$;
