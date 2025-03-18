
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EvaluationForm from "../EvaluationForm";
import { StudentEvaluation } from "../types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { X } from "lucide-react";

interface EditEvaluationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: StudentEvaluation | null;
  onSuccess: () => void;
}

export default function EditEvaluationDialog({
  isOpen,
  onOpenChange,
  evaluation,
  onSuccess
}: EditEvaluationDialogProps) {
  const [error, setError] = useState<string | null>(null);
  
  const handleSuccess = () => {
    setError(null);
    onSuccess();
  };
  
  const handleError = (message: string) => {
    setError(message);
    console.error("Evaluation update error:", message);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>编辑美本录取评估</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <X className="h-4 w-4 cursor-pointer" onClick={() => setError(null)} />
            </AlertDescription>
          </Alert>
        )}
        
        {evaluation && (
          <EvaluationForm 
            studentId={evaluation.student_id} 
            studentName={evaluation.student_name}
            onSuccess={handleSuccess}
            onError={handleError}
            existingEvaluation={evaluation}
            isEditing={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
