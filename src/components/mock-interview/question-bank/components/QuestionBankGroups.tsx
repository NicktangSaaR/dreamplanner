
import { Question } from "../types";
import QuestionBankItem from "../list/QuestionBankItem";

interface QuestionBankGroupsProps {
  questions: Question[];
  currentUserId: string | null;
  isAdmin: boolean;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

const QuestionBankGroups = ({
  questions,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete
}: QuestionBankGroupsProps) => {
  const systemQuestions = questions.filter(q => q.is_system);
  const customQuestions = questions.filter(q => !q.is_system);

  return (
    <div className="space-y-4">
      {systemQuestions.length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold px-2 py-1.5 text-sm text-muted-foreground">
            System Question Banks
          </div>
          {systemQuestions.map((question) => (
            <QuestionBankItem
              key={question.id}
              question={question}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
      {customQuestions.length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold px-2 py-1.5 text-sm text-muted-foreground">
            Custom Questions
          </div>
          {customQuestions.map((question) => (
            <QuestionBankItem
              key={question.id}
              question={question}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionBankGroups;
