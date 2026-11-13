-- Role access fixes.
--
-- 1. Counselor accounts waiting for admin approval can't be linked to students:
--    they're left out of the "choose my counselor" list, the link function
--    refuses them, and direct inserts need an approved counselor.
-- 2. Counselor-student links: clean, non-overlapping rules. Follow-up and other
--    team teachers can see who the student's lead counselor is.
-- 3. Team teachers (follow-up etc.) can read planning reports and the shared
--    Google Drive link, and manage reminder-email settings, like the lead.

create or replace function public.is_verified_counselor(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and user_type = 'counselor' and is_verified);
$$;

-- 1 + 2. counselor_student_relationships
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'counselor_student_relationships' loop
    execute format('drop policy %I on public.counselor_student_relationships', p.policyname);
  end loop;
end $$;
alter table public.counselor_student_relationships enable row level security;

create policy "Read own links and team links" on public.counselor_student_relationships for select
  using (counselor_id = auth.uid() or student_id = auth.uid() or public.is_admin(auth.uid())
    or exists (select 1 from public.counselor_collaborations c where c.student_id = counselor_student_relationships.student_id and c.collaborator_id = auth.uid()));
create policy "Approved counselors, their students and admins create links" on public.counselor_student_relationships for insert
  with check (public.is_admin(auth.uid())
    or (counselor_id = auth.uid() and public.is_verified_counselor(auth.uid()))
    or (student_id = auth.uid() and public.is_verified_counselor(counselor_id)));
create policy "Lead counselor and admins update links" on public.counselor_student_relationships for update
  using (counselor_id = auth.uid() or public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()) or (counselor_id = auth.uid() and public.is_verified_counselor(auth.uid())));
create policy "Lead counselor and admins remove links" on public.counselor_student_relationships for delete
  using (counselor_id = auth.uid() or public.is_admin(auth.uid()));

create or replace function public.list_counselors_for_student()
returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $function$
  select p.id, coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1))
  from public.profiles p
  where p.user_type = 'counselor' and p.is_verified
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.user_type = 'student')
  order by 2;
$function$;

create or replace function public.link_my_counselor(p_counselor_id uuid)
returns void language plpgsql security definer set search_path = public as $function$
declare
  me uuid := auth.uid();
begin
  if me is null or not exists (select 1 from public.profiles where id = me and user_type = 'student') then
    raise exception 'only students can link a counselor';
  end if;
  if not public.is_verified_counselor(p_counselor_id) then
    raise exception 'not a counselor';
  end if;
  if exists (select 1 from public.counselor_student_relationships where student_id = me) then
    raise exception 'already linked';
  end if;
  insert into public.counselor_student_relationships (counselor_id, student_id, added_by)
  values (p_counselor_id, me, me);
end $function$;

-- 3. Team teachers
drop policy if exists "Team reads student reports" on public.planning_reports;
create policy "Team reads student reports" on public.planning_reports for select
  using (public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));

drop policy if exists "Team reads student Google Drive link" on public.student_google_drive;
create policy "Team reads student Google Drive link" on public.student_google_drive for select
  using (public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));

drop policy if exists "Team manages reminder emails" on public.student_reminder_emails;
create policy "Team manages reminder emails" on public.student_reminder_emails for all
  using (public.can_access_student_data(auth.uid(), student_id))
  with check (public.can_access_student_data(auth.uid(), student_id));
