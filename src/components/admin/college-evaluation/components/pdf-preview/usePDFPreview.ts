
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { StudentEvaluation } from "../../types";
import { previewEvaluationPDF } from "../../utils/pdf";

export const usePDFPreview = (evaluation: StudentEvaluation, isOpen: boolean) => {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Generate the PDF preview when the dialog opens
  const generatePreview = async () => {
    if (isOpen && !pdfDataUrl) {
      setIsLoading(true);
      setError(null);
      try {
        const dataUrl = await previewEvaluationPDF(evaluation);
        setPdfDataUrl(dataUrl);
      } catch (error) {
        console.error('Error generating PDF preview:', error);
        setError(error instanceof Error ? error : new Error('Failed to generate PDF preview'));
        toast.error('生成PDF预览时出错', {
          description: '请尝试直接下载PDF查看'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Reset state when dialog closes
  const resetPreview = () => {
    setPdfDataUrl(null);
    setError(null);
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
    error,
    resetPreview
  };
};
