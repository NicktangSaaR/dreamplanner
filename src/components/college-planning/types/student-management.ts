import { User } from "@supabase/supabase-js";

export interface AddStudentDialogProps {
  counselorId: string;
  onStudentAdded: () => void;
}

export interface StudentSearchFormData {
  email: string;
}

export interface StudentSearchResult {
  user: User | null;
  error?: string;
}