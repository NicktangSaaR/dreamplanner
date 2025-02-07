
import { User } from "@supabase/supabase-js";

export interface AddStudentDialogProps {
  counselorId: string;
  onStudentAdded: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface StudentSearchFormData {
  email: string;
}

export interface StudentSearchResult {
  user: Partial<User> | null;
  error?: string;
}

export interface StudentProfile {
  id: string;
  full_name: string | null;
  grade: string | null;
  school: string | null;
  interested_majors: string[] | null;
  application_year?: string | null;
}
