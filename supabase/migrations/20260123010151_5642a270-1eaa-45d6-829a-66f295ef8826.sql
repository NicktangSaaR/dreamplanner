-- Create table for resume form requests (admin pushes to students)
CREATE TABLE public.resume_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'generated', 'completed')),
  due_date TIMESTAMP WITH TIME ZONE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for student resume data
CREATE TABLE public.resume_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.resume_requests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Info
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  linkedin_url TEXT,
  personal_website TEXT,
  
  -- Education (JSON array)
  education JSONB DEFAULT '[]'::jsonb,
  
  -- Work/Internship Experience (JSON array)
  work_experience JSONB DEFAULT '[]'::jsonb,
  
  -- Extracurricular Activities (JSON array)
  activities JSONB DEFAULT '[]'::jsonb,
  
  -- Awards & Honors (JSON array)
  awards JSONB DEFAULT '[]'::jsonb,
  
  -- Skills
  skills JSONB DEFAULT '[]'::jsonb,
  
  -- Additional sections
  certifications JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  
  -- Generated resume content
  generated_resume TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resume_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for resume_requests
CREATE POLICY "Admins can do everything with resume_requests"
ON public.resume_requests
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Students can view their own resume requests"
ON public.resume_requests
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Counselors can view their students resume requests"
ON public.resume_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM counselor_student_relationships csr
    WHERE csr.counselor_id = auth.uid() 
    AND csr.student_id = resume_requests.student_id
  )
);

-- RLS policies for resume_data
CREATE POLICY "Admins can do everything with resume_data"
ON public.resume_data
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Students can manage their own resume data"
ON public.resume_data
FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Counselors can view their students resume data"
ON public.resume_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM counselor_student_relationships csr
    WHERE csr.counselor_id = auth.uid() 
    AND csr.student_id = resume_data.student_id
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_resume_requests_updated_at
BEFORE UPDATE ON public.resume_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resume_data_updated_at
BEFORE UPDATE ON public.resume_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();