import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question } from "../types";
import QuestionBankDialog from "./QuestionBankDialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import QuestionBankItem from "./list/QuestionBankItem";

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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.is_admin || false);
      }
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

      const filteredData = data.filter(q => 
        q.is_system || 
        q.created_by === currentUserId ||
        isAdmin
      );

      console.log("Fetched question banks:", filteredData);
      return filteredData as Question[];
    },
    enabled: !!currentUserId,
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
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