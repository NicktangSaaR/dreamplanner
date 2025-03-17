
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EvaluationForm from "../EvaluationForm";
import { Student } from "../hooks/useStudentsQuery";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { X } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  
  const handleSuccess = () => {
    setError(null);
    onSuccess();
  };
  
  const handleError = (message: string) => {
    setError(message);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create US Undergraduate Admission Evaluation</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <X className="h-4 w-4 cursor-pointer" onClick={() => setError(null)} />
            </AlertDescription>
          </Alert>
        )}
        
        {selectedStudent && (
          <EvaluationForm 
            studentId={selectedStudent.id} 
            studentName={selectedStudent.full_name || "Unknown Student"}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
