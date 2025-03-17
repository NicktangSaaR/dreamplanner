
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { StudentEvaluation } from "../../types";
import { exportEvaluationToPDF } from "../../utils/pdf";

interface PDFPreviewFooterProps {
  evaluation: StudentEvaluation;
  onClose: () => void;
  isLoading: boolean;
}

export const PDFPreviewFooter = ({ 
  evaluation, 
  onClose, 
  isLoading 
}: PDFPreviewFooterProps) => {
  const handleDownload = () => {
    exportEvaluationToPDF(evaluation);
    onClose();
  };

  return (
    <DialogFooter className="flex justify-between">
      <Button 
        variant="outline" 
        onClick={onClose}
      >
        Cancel
      </Button>
      <Button 
        onClick={handleDownload}
        disabled={isLoading}
      >
        Download PDF
      </Button>
    </DialogFooter>
  );
};
