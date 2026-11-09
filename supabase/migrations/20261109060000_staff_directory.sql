-- Counselors can only read profiles of their own students, so team pickers
-- and team member names came back empty. This returns the staff list
-- (counselors and admins) to staff only.
create or replace function public.staff_directory()
returns table (id uuid, full_name text, email text, user_type text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.email, p.user_type
  from public.profiles p
  where p.user_type in ('counselor', 'admin')
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.user_type in ('counselor', 'admin'))
  order by coalesce(nullif(trim(p.full_name), ''), p.email);
$$;
revoke all on function public.staff_directory() from public, anon;
grant execute on function public.staff_directory() to authenticated;
