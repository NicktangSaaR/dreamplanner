-- Transfer students no longer see the application info form automatically:
-- their counselor opens it (提前开放给学生). College Bound / G12 students and
-- master's applicants still see it automatically.
create or replace function public.application_info_open(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select (auth.uid() = p_student or public.can_access_student_data(auth.uid(), p_student) or public.is_admin(auth.uid()))
     and (
       exists (select 1 from public.profiles where id = p_student and (
         status in ('College Bound', 'G12', 'Graduate') or applicant_type = 'graduate'))
       or exists (select 1 from public.application_profiles where student_id = p_student and open_early)
     );
$$;
