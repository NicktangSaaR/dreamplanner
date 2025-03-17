
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EvaluationForm from "../EvaluationForm";
import { Student } from "../hooks/useStudentsQuery";

interface EvaluationFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudent: Student | null;
  onSuccess: () => void;
}

export default function EvaluationFormDialog({
  isOpen,
  onOpenChange,
  selectedStudent,
  onSuccess
}: EvaluationFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create US Undergraduate Admission Evaluation</DialogTitle>
        </DialogHeader>
        {selectedStudent && (
          <EvaluationForm 
            studentId={selectedStudent.id} 
            studentName={selectedStudent.full_name || "Unknown Student"}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
