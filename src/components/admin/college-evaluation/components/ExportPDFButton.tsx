
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { StudentEvaluation } from "../types";
import { PDFPreviewDialog } from "./PDFPreviewDialog";

interface ExportPDFButtonProps {
  evaluation: StudentEvaluation;
  className?: string;
}

export const ExportPDFButton = ({ evaluation, className }: ExportPDFButtonProps) => {
  const [showPreview, setShowPreview] = useState(false);
  
  const handleOpenPreview = () => {
    setShowPreview(true);
  };

  return (
    <>
      <Button
        onClick={handleOpenPreview}
        variant="outline"
        size="sm"
        className={className}
      >
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
      
      <PDFPreviewDialog
        isOpen={showPreview}
        onOpenChange={setShowPreview}
        evaluation={evaluation}
      />
    </>
  );
};
