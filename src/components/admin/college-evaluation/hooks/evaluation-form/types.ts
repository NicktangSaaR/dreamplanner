
import { StudentEvaluation, EvaluationCriteria } from "../../types";

export interface UseEvaluationFormProps {
  studentId: string;
  studentName: string;
  existingEvaluation?: StudentEvaluation;
  isEditing?: boolean;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export interface UseEvaluationFormReturn {
  form: any; // Using any here as it's the return from useForm
  isSubmitting: boolean;
  universityType: string;
  setUniversityType: (type: any) => void;
  submittedEvaluation: StudentEvaluation | null;
  handleSubmit: (values: { criteria: EvaluationCriteria; comments: string }) => Promise<void>;
}
