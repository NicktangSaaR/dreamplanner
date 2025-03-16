
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { StudentEvaluation } from "../types";
import { exportEvaluationToPDF } from "../utils/pdfExportUtils";

interface ExportPDFButtonProps {
  evaluation: StudentEvaluation;
  className?: string;
}

export const ExportPDFButton = ({ evaluation, className }: ExportPDFButtonProps) => {
  const handleExport = () => {
    exportEvaluationToPDF(evaluation);
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className={className}
    >
      <FileText className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
};
