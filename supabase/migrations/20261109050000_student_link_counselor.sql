-- New students pick their lead counselor themselves. Students cannot read
-- other profiles, so the list of counselors and the link go through these
-- two functions. A student can link only once; changes after that are made
-- by the team or an admin.

create or replace function public.list_counselors_for_student()
returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1))
  from public.profiles p
  where p.user_type = 'counselor'
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.user_type = 'student')
  order by 2;
$$;

create or replace function public.link_my_counselor(p_counselor_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null or not exists (select 1 from public.profiles where id = me and user_type = 'student') then
    raise exception 'only students can link a counselor';
  end if;
  if not exists (select 1 from public.profiles where id = p_counselor_id and user_type = 'counselor') then
    raise exception 'not a counselor';
  end if;
  if exists (select 1 from public.counselor_student_relationships where student_id = me) then
    raise exception 'already linked';
  end if;
  insert into public.counselor_student_relationships (counselor_id, student_id, added_by)
  values (p_counselor_id, me, me);
end $$;

revoke all on function public.list_counselors_for_student() from public, anon;
revoke all on function public.link_my_counselor(uuid) from public, anon;
grant execute on function public.list_counselors_for_student() to authenticated;
grant execute on function public.link_my_counselor(uuid) to authenticated;

-- My lead counselor's name (students cannot read counselor profiles directly).
create or replace function public.my_counselor_name()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1))
  from public.counselor_student_relationships r join public.profiles p on p.id = r.counselor_id
  where r.student_id = auth.uid()
  order by r.created_at
  limit 1;
$$;
revoke all on function public.my_counselor_name() from public, anon;
grant execute on function public.my_counselor_name() to authenticated;
