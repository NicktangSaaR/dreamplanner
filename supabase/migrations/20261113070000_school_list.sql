-- School list (选校单): one row per school a student applies to, built by AI
-- from the student's planning documents, reports and meeting notes and
-- confirmed by the counselor. Reuses the older college_applications table.

alter table public.college_applications
  add column if not exists round text,
  add column if not exists application_system text,
  add column if not exists deadline date,
  add column if not exists deadline_checked boolean not null default false,
  add column if not exists status text not null default 'preparing',
  add column if not exists sort_order integer not null default 0,
  add column if not exists source text;

alter table public.college_applications drop constraint if exists college_applications_status_check;
alter table public.college_applications add constraint college_applications_status_check
  check (status in ('considering','preparing','submitted','admitted','waitlisted','deferred','rejected','withdrawn'));
alter table public.college_applications drop constraint if exists college_applications_system_check;
alter table public.college_applications add constraint college_applications_system_check
  check (application_system is null or application_system in ('CA','CO','UC','OU','BC','UK','HK','SG','GR','OTHER'));

-- Team teachers (follow-up etc.) work on it too, not only the lead counselor.
drop policy if exists "Counselors can manage their students' applications" on public.college_applications;
drop policy if exists "Team manages student school lists" on public.college_applications;
create policy "Team manages student school lists" on public.college_applications for all
  using (public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()))
  with check (public.can_access_student_data(auth.uid(), student_id) or public.is_admin(auth.uid()));

-- The old table required fields the new list doesn't always have.
alter table public.college_applications alter column major drop not null;
alter table public.college_applications alter column degree drop not null;
alter table public.college_applications alter column college_url drop not null;

-- Fit: reach / target / safety (old values converted).
alter table public.college_applications drop constraint if exists college_applications_category_check;
update public.college_applications set category = case
  when category in ('Hard Reach', 'Reach') then 'reach'
  when category in ('Hard Target', 'Target') then 'target'
  when category = 'Safety' then 'safety'
  else category end
 where category in ('Hard Reach', 'Reach', 'Hard Target', 'Target', 'Safety');
alter table public.college_applications add constraint college_applications_category_check
  check (category is null or category in ('reach', 'target', 'safety'));
