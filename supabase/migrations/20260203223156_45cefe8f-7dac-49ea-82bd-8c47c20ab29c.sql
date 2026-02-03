-- Create storage bucket for planning documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('planning-documents', 'planning-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for planning documents bucket
-- Counselors and admins can upload documents
CREATE POLICY "Counselors can upload planning documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'planning-documents' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('counselor', 'admin')
  )
);

-- Counselors, admins, and the student can view their documents
CREATE POLICY "Users can view planning documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'planning-documents' AND
  (
    -- Admin or counselor can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('counselor', 'admin')
    )
    OR
    -- Student can view their own (path starts with their ID)
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Counselors and admins can delete documents
CREATE POLICY "Counselors can delete planning documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'planning-documents' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('counselor', 'admin')
  )
);

-- Add file_path column to planning_documents table if it doesn't exist
ALTER TABLE planning_documents ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE planning_documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE planning_documents ADD COLUMN IF NOT EXISTS content TEXT;