-- Changing and postponing tasks.
--  * reschedule_task(): one way to move a due date, which keeps a history row.
--  * Tasks the team assigned to a student (from a meeting, a key date or added
--    by the team) can't be re-dated, renamed or deleted by the student; the
--    student asks for an extension instead, and the team approves or declines.

alter table public.todos add column if not exists assigned_by uuid references public.profiles(id) on delete set null;

create or replace function public.todo_is_assigned(p_todo_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.todos t
    where t.id = p_todo_id
      and (t.assigned_by is not null
           or t.title like '📌%'
           or exists (select 1 from public.meeting_action_items a where a.todo_id = t.id))
  );
$$;
grant execute on function public.todo_is_assigned(uuid) to authenticated;

create or replace function public.guard_assigned_todo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() = new.author_id then new.assigned_by := null; end if;
    return new;
  end if;
  if auth.uid() is null or auth.uid() <> old.author_id or not public.todo_is_assigned(old.id) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'assigned task: ask your counselor';
  end if;
  if new.due_date is distinct from old.due_date or new.title is distinct from old.title or new.assigned_by is distinct from old.assigned_by then
    raise exception 'assigned task: request an extension';
  end if;
  return new;
end $$;

drop trigger if exists guard_assigned_todo on public.todos;
create trigger guard_assigned_todo before insert or update or delete on public.todos
  for each row execute function public.guard_assigned_todo();

-- History of date changes ------------------------------------------------------
create table if not exists public.task_postponements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  task_table text not null check (task_table in ('todos', 'meeting_action_items')),
  task_id uuid not null,
  old_due date,
  new_due date,
  reason text,
  via text not null check (via in ('team', 'student', 'request')),
  changed_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists task_postponements_task_idx on public.task_postponements(task_id);
create index if not exists task_postponements_student_idx on public.task_postponements(student_id);
alter table public.task_postponements enable row level security;
create policy "Students and their team read task history" on public.task_postponements
  for select to authenticated
  using (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));
-- rows are written only by reschedule_task / decide_extension

create or replace function public.reschedule_task(p_table text, p_task_id uuid, p_due date, p_reason text default null, p_via text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  v_student uuid;
  v_old date;
  v_via text;
begin
  if p_table = 'todos' then
    select author_id, due_date::date into v_student, v_old from public.todos where id = p_task_id;
  elsif p_table = 'meeting_action_items' then
    select student_id, due_date into v_student, v_old from public.meeting_action_items where id = p_task_id;
  else
    raise exception 'unknown task table';
  end if;
  if v_student is null then raise exception 'task not found'; end if;

  if me = v_student then
    if p_table <> 'todos' or public.todo_is_assigned(p_task_id) then
      raise exception 'assigned task: request an extension';
    end if;
    v_via := 'student';
  elsif public.can_access_student_data(me, v_student) or public.is_admin(me) then
    v_via := coalesce(p_via, 'team');
  else
    raise exception 'not allowed';
  end if;

  if p_table = 'todos' then
    update public.todos set due_date = p_due where id = p_task_id;
  else
    update public.meeting_action_items set due_date = p_due where id = p_task_id;
  end if;

  if v_old is distinct from p_due and v_old is not null then
    insert into public.task_postponements (student_id, task_table, task_id, old_due, new_due, reason, via, changed_by)
    values (v_student, p_table, p_task_id, v_old, p_due, nullif(trim(p_reason), ''), v_via, me);
  end if;
end $$;
revoke all on function public.reschedule_task(text, uuid, date, text, text) from public, anon;
grant execute on function public.reschedule_task(text, uuid, date, text, text) to authenticated;

-- Extension requests -------------------------------------------------------------
create table if not exists public.task_extension_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  todo_id uuid not null references public.todos(id) on delete cascade,
  current_due date,
  requested_due date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists task_extension_requests_student_idx on public.task_extension_requests(student_id, status);
alter table public.task_extension_requests enable row level security;
create policy "Students and their team read extension requests" on public.task_extension_requests
  for select to authenticated
  using (student_id = auth.uid() or public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));
create policy "Students ask for an extension on their own tasks" on public.task_extension_requests
  for insert to authenticated
  with check (
    student_id = auth.uid() and status = 'pending' and decided_by is null
    and exists (select 1 from public.todos t where t.id = todo_id and t.author_id = auth.uid())
  );
create policy "Students withdraw their pending requests" on public.task_extension_requests
  for delete to authenticated
  using (student_id = auth.uid() and status = 'pending');

create or replace function public.decide_extension(p_request_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  r public.task_extension_requests;
begin
  select * into r from public.task_extension_requests where id = p_request_id;
  if r.id is null then raise exception 'request not found'; end if;
  if not (public.can_access_student_data(auth.uid(), r.student_id) or public.is_admin(auth.uid())) then
    raise exception 'not allowed';
  end if;
  if r.status <> 'pending' then raise exception 'already decided'; end if;
  if p_approve then
    perform public.reschedule_task('todos', r.todo_id, r.requested_due, r.reason, 'request');
  end if;
  update public.task_extension_requests
     set status = case when p_approve then 'approved' else 'declined' end, decided_by = auth.uid(), decided_at = now()
   where id = r.id;
end $$;
revoke all on function public.decide_extension(uuid, boolean) from public, anon;
grant execute on function public.decide_extension(uuid, boolean) to authenticated;
