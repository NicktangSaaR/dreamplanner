
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StudentEvaluation } from "../types";
import { PDFPreviewContent } from "./pdf-preview/PDFPreviewContent";
import { PDFPreviewFooter } from "./pdf-preview/PDFPreviewFooter";
import { usePDFPreview } from "./pdf-preview/usePDFPreview";

interface PDFPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: StudentEvaluation;
}

export const PDFPreviewDialog = ({ 
  isOpen, 
  onOpenChange, 
  evaluation 
}: PDFPreviewDialogProps) => {
  const { pdfDataUrl, isLoading, resetPreview } = usePDFPreview(evaluation, isOpen);
  
  // Handle dialog close with cleanup
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetPreview();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>PDF Preview - {evaluation.student_name}'s Evaluation</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
          <PDFPreviewContent 
            pdfDataUrl={pdfDataUrl} 
            isLoading={isLoading} 
          />
        </div>
        
        <PDFPreviewFooter 
          evaluation={evaluation} 
          onClose={() => onOpenChange(false)} 
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};
