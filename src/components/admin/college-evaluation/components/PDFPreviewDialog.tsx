
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StudentEvaluation } from "../types";
import { previewEvaluationPDF, exportEvaluationToPDF } from "../utils/pdf";

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
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate the PDF preview when the dialog opens
  const generatePreview = async () => {
    if (isOpen && !pdfDataUrl) {
      setIsLoading(true);
      try {
        const dataUrl = await previewEvaluationPDF(evaluation);
        setPdfDataUrl(dataUrl);
      } catch (error) {
        console.error('Error generating PDF preview:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setPdfDataUrl(null);
    }
  };
  
  // Handle download
  const handleDownload = () => {
    exportEvaluationToPDF(evaluation);
    onOpenChange(false);
  };
  
  // Generate preview when dialog opens
  if (isOpen && !pdfDataUrl && !isLoading) {
    generatePreview();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>PDF Preview - {evaluation.student_name}'s Evaluation</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Generating PDF preview...</p>
            </div>
          ) : pdfDataUrl ? (
            <iframe 
              src={pdfDataUrl} 
              className="w-full h-[65vh] border-0"
              title="PDF Preview" 
            />
          ) : (
            <div className="p-8 text-center">
              <p>Unable to generate preview</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
};
