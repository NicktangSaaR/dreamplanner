
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question } from "../types";
import QuestionBankDialog from "./QuestionBankDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useUserStatus } from "@/hooks/useUserStatus";
import { useQuestionBanks } from "@/hooks/useQuestionBanks";
import QuestionBankSections from "./QuestionBankSections";

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
  const { currentUserId, isAdmin } = useUserStatus();
  
  const {
    systemQuestions,
    customQuestions,
    isLoading,
    refetch,
    handleDelete
  } = useQuestionBanks(currentUserId, isAdmin);

  const handleEdit = (question: Question) => {
    setQuestionToEdit(question);
    setIsDialogOpen(true);
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
          <QuestionBankSections
            systemQuestions={systemQuestions}
            customQuestions={customQuestions}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={async (questionId) => {
              const success = await handleDelete(questionId);
              if (success && selectedQuestionId === questionId) {
                onQuestionSelect('');
              }
            }}
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
