
import { useState, useEffect } from 'react';
import { StudentEvaluation } from "../../types";
import { previewEvaluationPDF } from "../../utils/pdf";

export const usePDFPreview = (evaluation: StudentEvaluation, isOpen: boolean) => {
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
  const resetPreview = () => {
    setPdfDataUrl(null);
  };
  
  // Generate preview when dialog opens
  useEffect(() => {
    if (isOpen && !pdfDataUrl && !isLoading) {
      generatePreview();
    }
  }, [isOpen, pdfDataUrl, isLoading]);
  
  return {
    pdfDataUrl,
    isLoading,
    resetPreview
  };
};
