
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
      <object 
        data={pdfDataUrl} 
        type="application/pdf"
        className="w-full h-[65vh]"
        title="PDF预览"
      >
        <p>您的浏览器无法显示PDF，<a href={pdfDataUrl} target="_blank" rel="noopener noreferrer">点击此处下载</a></p>
      </object>
    );
  }
  
  return (
    <div className="p-8 text-center">
      <p>无法生成预览</p>
    </div>
  );
};
