-- Students may delete report cards they uploaded themselves, but not ones a
-- counselor, follow-up teacher or admin uploaded for them. The table policy
-- already says so; the storage policy let a student delete any file in their
-- own folder, so it now checks who uploaded the file as well.
DROP POLICY IF EXISTS "Report cards: delete own or team student files" ON storage.objects;
CREATE POLICY "Report cards: delete own or team student files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'academic-reports'
    AND (
      (
        (storage.foldername(name))[1] = auth.uid()::text
        AND NOT EXISTS (
          SELECT 1 FROM public.academic_reports r
           WHERE r.file_path = storage.objects.name
             AND r.uploaded_by IS DISTINCT FROM auth.uid()
        )
      )
      OR public.can_access_student_data(auth.uid(), public.safe_uuid((storage.foldername(name))[1]))
      OR public.is_admin(auth.uid())
    )
  );
