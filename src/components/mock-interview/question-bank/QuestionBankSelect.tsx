
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Question } from "./types";
import QuestionBankDialog from "./QuestionBankDialog";
import { useQuestionBanks } from "./hooks/useQuestionBanks";
import QuestionBankGroups from "./components/QuestionBankGroups";
import { supabase } from "@/integrations/supabase/client";

interface QuestionBankSelectProps {
  selectedQuestionId: string | null;
  onQuestionSelect: (questionId: string) => void;
}

const QuestionBankSelect = ({
  selectedQuestionId,
  onQuestionSelect,
}: QuestionBankSelectProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const { questions = [], isLoading, refetch, currentUserId, isAdmin } = useQuestionBanks();

  const handleEdit = (question: Question) => {
    setQuestionToEdit(question);
    setIsDialogOpen(true);
  };

  const handleDelete = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to delete this question bank?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mock_interview_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast.success("Question bank deleted successfully");
      refetch();
      
      if (selectedQuestionId === questionId) {
        onQuestionSelect('');
      }
    } catch (error) {
      console.error("Error deleting question bank:", error);
      toast.error("Failed to delete question bank");
    }
  };

  if (isLoading) {
    return <div>Loading question banks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="mb-2 block">Select Question Bank</Label>
        <Button
          onClick={() => {
            setQuestionToEdit(null);
            setIsDialogOpen(true);
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Bank
        </Button>
      </div>
      <Select
        value={selectedQuestionId || ""}
        onValueChange={onQuestionSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a question bank" />
        </SelectTrigger>
        <SelectContent>
          <QuestionBankGroups
            questions={questions}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </SelectContent>
      </Select>
      <QuestionBankDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        questionToEdit={questionToEdit}
        onClose={() => {
          setIsDialogOpen(false);
          setQuestionToEdit(null);
          refetch();
        }}
      />
    </div>
  );
};

export default QuestionBankSelect;
