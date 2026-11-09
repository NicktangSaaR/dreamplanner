-- One task list per student. Student tasks stay in `todos` (reminders keep
-- working); counselor / parent tasks live in `meeting_action_items`, which can
-- now also hold tasks added by hand (no meeting). Hand-added team tasks are
-- team-only; tasks that came from a meeting stay visible to the student with
-- the meeting notes, as before.

alter table public.meeting_action_items add column if not exists student_id uuid references public.profiles(id) on delete cascade;
update public.meeting_action_items a set student_id = m.student_id
  from public.student_meetings m where m.id = a.meeting_id and a.student_id is null;
alter table public.meeting_action_items alter column meeting_id drop not null;
alter table public.meeting_action_items alter column student_id set not null;
create index if not exists meeting_action_items_student_idx on public.meeting_action_items(student_id);

create or replace function public.fill_action_item_student()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.student_id is null and new.meeting_id is not null then
    select student_id into new.student_id from public.student_meetings where id = new.meeting_id;
  end if;
  return new;
end $$;

drop trigger if exists fill_action_item_student on public.meeting_action_items;
create trigger fill_action_item_student before insert on public.meeting_action_items
  for each row execute function public.fill_action_item_student();

drop policy if exists "Students read their meeting tasks" on public.meeting_action_items;
drop policy if exists "Team manages meeting tasks" on public.meeting_action_items;

create policy "Students read their meeting tasks" on public.meeting_action_items
  for select to authenticated
  using (student_id = auth.uid() and meeting_id is not null);

create policy "Team manages student tasks" on public.meeting_action_items
  for all to authenticated
  using (public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()))
  with check (public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));

-- Key dates (planning_milestones): the whole team, not only the lead counselor.
drop policy if exists "Team manages student milestones" on public.planning_milestones;
create policy "Team manages student milestones" on public.planning_milestones
  for all to authenticated
  using (public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()))
  with check (public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));

-- Communication log (notes): follow-up teachers can add and edit notes too.
drop policy if exists "Team writes student notes" on public.notes;
create policy "Team writes student notes" on public.notes
  for all to authenticated
  using (public.can_access_student_data(auth.uid(), author_id))
  with check (public.can_access_student_data(auth.uid(), author_id));

-- Quick notes can be team-only (e.g. a call with the parent about budget).
alter table public.notes add column if not exists team_only boolean not null default false;
drop policy if exists "Enable read access for users" on public.notes;
create policy "Enable read access for users" on public.notes
  for select to authenticated
  using (
    (author_id = auth.uid() and not team_only)
    or exists (select 1 from public.counselor_student_relationships c where c.counselor_id = auth.uid() and c.student_id = notes.author_id)
  );
