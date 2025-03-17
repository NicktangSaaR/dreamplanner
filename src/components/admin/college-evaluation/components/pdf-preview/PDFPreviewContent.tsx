
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { StudentEvaluation } from "../../types";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFPreviewContentProps {
  pdfDataUrl: string | null;
  isLoading: boolean;
}

export const PDFPreviewContent = ({ pdfDataUrl, isLoading }: PDFPreviewContentProps) => {
  const [loadError, setLoadError] = useState(false);
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-700">正在生成PDF预览...</p>
      </div>
    );
  }
  
  if (pdfDataUrl) {
    return (
      <div className="w-full h-full flex flex-col">
        {loadError && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              PDF预览加载失败，请尝试直接下载PDF
            </AlertDescription>
          </Alert>
        )}
        
        <object 
          data={pdfDataUrl} 
          type="application/pdf"
          className="w-full h-[65vh]"
          title="PDF预览"
          onError={() => setLoadError(true)}
        >
          <div className="p-6 text-center bg-gray-100 rounded-md">
            <p className="mb-3">您的浏览器无法显示PDF</p>
            <a 
              href={pdfDataUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              点击此处下载PDF文件
            </a>
          </div>
        </object>
      </div>
    );
  }
  
  return (
    <div className="p-8 text-center">
      <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
      <p className="text-gray-700 mb-2">无法生成PDF预览</p>
      <p className="text-sm text-gray-500">可能是字体加载问题，请尝试直接下载PDF查看</p>
    </div>
  );
};
