
import { StudentEvaluation } from "../../types";

interface PDFPreviewContentProps {
  pdfDataUrl: string | null;
  isLoading: boolean;
}

export const PDFPreviewContent = ({ pdfDataUrl, isLoading }: PDFPreviewContentProps) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Generating PDF preview...</p>
      </div>
    );
  }
  
  if (pdfDataUrl) {
    return (
      <iframe 
        src={pdfDataUrl} 
        className="w-full h-[65vh] border-0"
        title="PDF Preview" 
      />
    );
  }
  
  return (
    <div className="p-8 text-center">
      <p>Unable to generate preview</p>
    </div>
  );
};
