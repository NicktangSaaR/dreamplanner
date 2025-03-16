
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>创建美国本科录取评估表</DialogTitle>
        </DialogHeader>
        {selectedStudent && (
          <EvaluationForm 
            studentId={selectedStudent.id} 
            studentName={selectedStudent.full_name || "未知学生"}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
