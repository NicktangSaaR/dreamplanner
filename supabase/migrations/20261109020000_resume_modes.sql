-- Resume: students may start their own resume, and both students and their
-- service team can store / read uploaded resumes under <student_id>/… in the
-- resume-uploads bucket.

drop policy if exists "Students start their own resume requests" on public.resume_requests;
create policy "Students start their own resume requests" on public.resume_requests
  for insert to authenticated
  with check (student_id = auth.uid() and admin_id is null);

drop policy if exists "Students read own resume uploads" on storage.objects;
create policy "Students read own resume uploads" on storage.objects
  for select to authenticated
  using (bucket_id = 'resume-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Team reads student resume uploads" on storage.objects;
create policy "Team reads student resume uploads" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resume-uploads'
    and public.can_access_student_data(auth.uid(), public.safe_uuid((storage.foldername(name))[1]))
  );
