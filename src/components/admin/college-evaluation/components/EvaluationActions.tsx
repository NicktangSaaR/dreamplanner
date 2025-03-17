
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { StudentEvaluation } from "../types";
import { PDFPreviewDialog } from "./PDFPreviewDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface EvaluationActionsProps {
  evaluation: StudentEvaluation;
}

export const EvaluationActions = ({ evaluation }: EvaluationActionsProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleExportPDF = () => {
    setShowPreview(true);
  };

  const handleDeleteEvaluation = async () => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("student_evaluations")
        .delete()
        .eq("id", evaluation.id);
      
      if (error) {
        console.error("Error deleting evaluation:", error);
        toast.error("删除评估失败", {
          description: error.message
        });
        return;
      }
      
      await queryClient.invalidateQueries({ queryKey: ["student-evaluations"] });
      toast.success("评估已成功删除");
    } catch (err) {
      console.error("Unexpected error during deletion:", err);
      toast.error("删除过程中发生错误");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleExportPDF}
          title="Export Evaluation as PDF"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteEvaluation}
          disabled={isDeleting}
          title="Delete Evaluation"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {showPreview && (
        <PDFPreviewDialog
          isOpen={showPreview}
          onOpenChange={setShowPreview}
          evaluation={evaluation}
        />
      )}
    </>
  );
};
