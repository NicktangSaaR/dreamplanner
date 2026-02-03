-- Table to store Google Drive OAuth tokens for each student
CREATE TABLE public.student_google_drive (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  folder_id TEXT, -- The Google Drive folder ID for this student's planning documents
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- Table to store planning document references
CREATE TABLE public.planning_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  google_doc_id TEXT NOT NULL,
  title TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false, -- The main planning document to display
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store AI-extracted milestones from planning documents
CREATE TABLE public.planning_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.planning_documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  reminder_emails TEXT[], -- Array of email addresses to notify
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_google_drive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_google_drive
CREATE POLICY "Students can view their own Google Drive connection"
  ON public.student_google_drive FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their own Google Drive connection"
  ON public.student_google_drive FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Counselors can view student Google Drive connections"
  ON public.student_google_drive FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM counselor_student_relationships
      WHERE counselor_id = auth.uid() AND student_id = student_google_drive.student_id
    )
  );

-- RLS policies for planning_documents
CREATE POLICY "Students can view their own planning documents"
  ON public.planning_documents FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their own planning documents"
  ON public.planning_documents FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Counselors can view and manage student planning documents"
  ON public.planning_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM counselor_student_relationships
      WHERE counselor_id = auth.uid() AND student_id = planning_documents.student_id
    )
  );

-- RLS policies for planning_milestones
CREATE POLICY "Students can view their own milestones"
  ON public.planning_milestones FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their own milestones"
  ON public.planning_milestones FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Counselors can view and manage student milestones"
  ON public.planning_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM counselor_student_relationships
      WHERE counselor_id = auth.uid() AND student_id = planning_milestones.student_id
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_student_google_drive_updated_at
  BEFORE UPDATE ON public.student_google_drive
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_documents_updated_at
  BEFORE UPDATE ON public.planning_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_milestones_updated_at
  BEFORE UPDATE ON public.planning_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();