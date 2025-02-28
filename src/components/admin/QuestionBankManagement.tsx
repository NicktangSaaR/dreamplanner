import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import QuestionBankDialog from "./QuestionBankDialog";
import QuestionListDialog from "./QuestionListDialog";
import { useState } from "react";
import { Question } from "@/components/mock-interview/types";

const QuestionBankManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['admin-question-banks'],
    queryFn: async () => {
      console.log("Fetching question banks...");
      const { data, error } = await supabase
        .from('mock_interview_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching question banks:", error);
        throw error;
      }

      console.log("Fetched question banks:", data);
      return data as Question[];
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      console.log("Attempting to delete question bank:", questionId);
      
      // First delete all bank questions
      const { error: bankQuestionsError } = await supabase
        .from('mock_interview_bank_questions')
        .delete()
        .eq('bank_id', questionId);

      if (bankQuestionsError) {
        console.error("Error deleting bank questions:", bankQuestionsError);
        throw bankQuestionsError;
      }

      // Then delete the question bank
      const { error } = await supabase
        .from('mock_interview_questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        console.error("Error deleting question bank:", error);
        throw error;
      }

      console.log("Successfully deleted question bank and its questions");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-question-banks'] });
      toast.success("Question bank deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting question bank:", error);
      toast.error("Failed to delete question bank");
    },
  });

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setIsDialogOpen(true);
  };

  const handleDelete = async (questionId: string) => {
    if (window.confirm("Are you sure you want to delete this question bank? This will also delete all questions in this bank.")) {
      deleteQuestion.mutate(questionId);
    }
  };

  const handleManageQuestions = (bank: Question) => {
    setSelectedBank(bank);
    setIsQuestionListOpen(true);
  };

  if (isLoading) {
    return <div>Loading question banks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Question Bank Management</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question Bank
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Prep Time</TableHead>
            <TableHead>Response Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => (
            <TableRow key={question.id}>
              <TableCell>{question.title}</TableCell>
              <TableCell>
                <Badge variant={question.is_system ? "default" : "secondary"}>
                  {question.is_system ? "System" : "Custom"}
                </Badge>
              </TableCell>
              <TableCell>{question.preparation_time}s</TableCell>
              <TableCell>{question.response_time}s</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleManageQuestions(question)}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(question)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(question.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <QuestionBankDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        questionToEdit={editingQuestion}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingQuestion(null);
        }}
      />

      {selectedBank && (
        <QuestionListDialog
          open={isQuestionListOpen}
          onOpenChange={setIsQuestionListOpen}
          bank={selectedBank}
        />
      )}
    </div>
  );
};

export default QuestionBankManagement;