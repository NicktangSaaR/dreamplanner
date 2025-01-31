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
import QuestionBankDialog from "./QuestionBankDialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const { data: questions = [], isLoading, refetch } = useQuery({
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
          created_by,
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
      
      // If the deleted question was selected, clear the selection
      if (selectedQuestionId === questionId) {
        onQuestionSelect('');
      }
    } catch (error) {
      console.error("Error deleting question bank:", error);
      toast.error("Failed to delete question bank");
    }
  };

  const systemQuestions = questions.filter(q => q.is_system);
  const customQuestions = questions.filter(q => !q.is_system);

  if (isLoading) {
    return <div>Loading question banks...</div>;
  }

  return (
    <div className="space-y-4">
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
                  <div key={question.id} className="flex items-center justify-between px-2">
                    <SelectItem value={question.id}>
                      {question.title} ({question.mock_interview_bank_questions?.length || 0} questions)
                    </SelectItem>
                    {currentUserId && question.created_by === currentUserId && (
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEdit(question);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(question.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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