import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  selectedQuestionId: string | null;
  onQuestionSelect: (questionId: string) => void;
}

const QuestionBankSelect = ({
  selectedQuestionId,
  onQuestionSelect,
}: QuestionBankSelectProps) => {
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['interview-questions'],
    queryFn: async () => {
      console.log("Fetching question banks...");
      const { data, error } = await supabase
        .from('mock_interview_questions')
        .select(`
          id,
          title,
          description,
          preparation_time,
          response_time,
          is_system,
          mock_interview_bank_questions (
            id,
            title,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching question banks:", error);
        throw error;
      }

      console.log("Fetched question banks:", data);
      return data as Question[];
    },
  });

  const systemQuestions = questions.filter(q => q.is_system);
  const customQuestions = questions.filter(q => !q.is_system);

  if (isLoading) {
    return <div>Loading question banks...</div>;
  }

  return (
    <div>
      <Label className="mb-2 block">Select Question Bank</Label>
      <Select
        value={selectedQuestionId || ""}
        onValueChange={onQuestionSelect}
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
                    {question.title} ({question.mock_interview_bank_questions?.length || 0} questions)
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
                    {question.title} ({question.mock_interview_bank_questions?.length || 0} questions)
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