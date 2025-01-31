import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { Question } from "../types";

interface QuestionBankItemProps {
  question: Question;
  currentUserId: string | null;
  isAdmin: boolean;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

const QuestionBankItem = ({
  question,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete
}: QuestionBankItemProps) => {
  const canManage = currentUserId && 
    (question.created_by === currentUserId || isAdmin);

  return (
    <div className="flex items-center justify-between px-2">
      <SelectItem value={question.id}>
        {question.title} ({question.mock_interview_bank_questions?.length || 0} questions)
      </SelectItem>
      {canManage && (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              onEdit(question);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              onDelete(question.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionBankItem;