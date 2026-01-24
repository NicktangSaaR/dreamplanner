-- Add public_token column to resume_requests for public form access
ALTER TABLE public.resume_requests 
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add RLS policy to allow public access via token
CREATE POLICY "Public access to resume_requests via token"
ON public.resume_requests
FOR SELECT
USING (true);

-- Policy for resume_data to allow public insert/update via valid token
CREATE POLICY "Public can insert resume_data with valid token"
ON public.resume_data
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.resume_requests rr 
    WHERE rr.id = request_id 
    AND rr.public_token IS NOT NULL
  )
);

CREATE POLICY "Public can update resume_data with valid token"
ON public.resume_data
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.resume_requests rr 
    WHERE rr.id = request_id 
    AND rr.public_token IS NOT NULL
  )
);

CREATE POLICY "Public can view resume_data with valid token"
ON public.resume_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.resume_requests rr 
    WHERE rr.id = request_id 
    AND rr.public_token IS NOT NULL
  )
);