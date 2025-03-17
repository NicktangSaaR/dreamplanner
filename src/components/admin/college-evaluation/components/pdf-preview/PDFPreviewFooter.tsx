
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { StudentEvaluation } from "../../types";
import { exportEvaluationToPDF } from "../../utils/pdf";

interface PDFPreviewFooterProps {
  evaluation: StudentEvaluation;
  onClose: () => void;
  isLoading: boolean;
}

export const PDFPreviewFooter = ({ evaluation, onClose, isLoading }: PDFPreviewFooterProps) => {
  const handleDownload = () => {
    exportEvaluationToPDF(evaluation);
  };

  return (
    <div className="flex justify-between items-center pt-4 border-t">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClose}
      >
        <X className="h-4 w-4 mr-2" />
        Close
      </Button>
      
      <Button 
        onClick={handleDownload} 
        disabled={isLoading}
        size="sm"
      >
        <Download className="h-4 w-4 mr-2" />
        Download PDF
      </Button>
    </div>
  );
};
