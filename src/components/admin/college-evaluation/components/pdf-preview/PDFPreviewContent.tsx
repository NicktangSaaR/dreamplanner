
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
        <p>生成PDF预览中...</p>
      </div>
    );
  }
  
  if (pdfDataUrl) {
    return (
      <iframe 
        src={pdfDataUrl} 
        className="w-full h-[65vh] border-0"
        title="PDF预览" 
        sandbox="allow-scripts allow-same-origin"
      />
    );
  }
  
  return (
    <div className="p-8 text-center">
      <p>无法生成预览</p>
    </div>
  );
};
