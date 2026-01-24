-- Create storage bucket for resume file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-uploads', 'resume-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Anyone can upload resume files (public access via token link)
CREATE POLICY "Anyone can upload resume files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resume-uploads');

-- RLS policy: Admins can view all resume files
CREATE POLICY "Admins can view resume files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resume-uploads' AND public.is_admin(auth.uid()));

-- RLS policy: Admins can delete resume files
CREATE POLICY "Admins can delete resume files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resume-uploads' AND public.is_admin(auth.uid()));

-- Add uploaded_file_path column to resume_data table
ALTER TABLE public.resume_data
ADD COLUMN IF NOT EXISTS uploaded_file_path TEXT;