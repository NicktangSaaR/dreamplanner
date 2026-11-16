-- Admins can switch a student's lead counselor in one step.
-- The new lead leaves the team list if they were on it, and the team's
-- remaining members are re-pointed at the new lead.
create or replace function public.set_lead_counselor(p_student uuid, p_counselor uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'only admins can change the lead counselor' using errcode = '42501';
  end if;
  if not exists (select 1 from profiles where id = p_student and user_type = 'student') then
    raise exception 'student not found';
  end if;
  if not exists (select 1 from profiles where id = p_counselor and user_type = 'counselor') then
    raise exception 'counselor not found';
  end if;

  delete from counselor_collaborations where student_id = p_student and collaborator_id = p_counselor;
  update counselor_collaborations set primary_counselor_id = p_counselor where student_id = p_student;

  insert into counselor_student_relationships (counselor_id, student_id, added_by)
  values (p_counselor, p_student, auth.uid())
  on conflict (student_id) do update
    set counselor_id = excluded.counselor_id, added_by = excluded.added_by, updated_at = now();
end;
$$;

revoke all on function public.set_lead_counselor(uuid, uuid) from public, anon;
grant execute on function public.set_lead_counselor(uuid, uuid) to authenticated;
