import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question } from "../types";

interface QuestionBankSelectProps {
  questions: Question[];
  selectedQuestionId: string | null;
  onQuestionSelect: (questionId: string) => void;
}

const QuestionBankSelect = ({
  questions,
  selectedQuestionId,
  onQuestionSelect,
}: QuestionBankSelectProps) => {
  const systemQuestions = questions.filter(q => q.is_system);
  const customQuestions = questions.filter(q => !q.is_system);

  return (
    <div>
      <Label className="mb-2 block">Select Question Bank</Label>
      <Select
        value={selectedQuestionId || ""}
        onValueChange={(value) => onQuestionSelect(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a question bank" />
        </SelectTrigger>
        <SelectContent>
          <div className="space-y-4">
            {systemQuestions.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold px-2 py-1.5 text-sm text-muted-foreground">
                  System Question Banks
                </div>
                {systemQuestions.map((question) => (
                  <SelectItem key={question.id} value={question.id}>
                    {question.title}
                  </SelectItem>
                ))}
              </div>
            )}
            {customQuestions.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold px-2 py-1.5 text-sm text-muted-foreground">
                  Custom Questions
                </div>
                {customQuestions.map((question) => (
                  <SelectItem key={question.id} value={question.id}>
                    {question.title}
                  </SelectItem>
                ))}
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

export default QuestionBankSelect;