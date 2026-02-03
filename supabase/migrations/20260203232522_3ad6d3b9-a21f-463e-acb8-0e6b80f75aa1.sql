-- Create table for student-specific reminder emails
CREATE TABLE public.student_reminder_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, email)
);

-- Enable RLS
ALTER TABLE public.student_reminder_emails ENABLE ROW LEVEL SECURITY;

-- Admin can manage all reminder emails
CREATE POLICY "Admins can manage student reminder emails"
ON public.student_reminder_emails
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Counselors can view and manage emails for their students
CREATE POLICY "Counselors can manage reminder emails for their students"
ON public.student_reminder_emails
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.counselor_student_relationships
    WHERE counselor_student_relationships.student_id = student_reminder_emails.student_id
    AND counselor_student_relationships.counselor_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_student_reminder_emails_student_id ON public.student_reminder_emails(student_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_student_reminder_emails_updated_at
BEFORE UPDATE ON public.student_reminder_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();