import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Question } from "@/components/mock-interview/types";
import { useState } from "react";
import BankQuestionDialog from "./BankQuestionDialog";

interface QuestionListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank: Question;
}

interface BankQuestion {
  id: string;
  title: string;
  description: string | null;
  bank_id: string;
}

const QuestionListDialog = ({
  open,
  onOpenChange,
  bank,
}: QuestionListDialogProps) => {
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['bank-questions', bank.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mock_interview_bank_questions')
        .select('*')
        .eq('bank_id', bank.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BankQuestion[];
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase
        .from('mock_interview_bank_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-questions', bank.id] });
      toast.success("Question deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    },
  });

  const handleEdit = (question: BankQuestion) => {
    setEditingQuestion(question);
    setIsQuestionDialogOpen(true);
  };

  const handleDelete = async (questionId: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      deleteQuestion.mutate(questionId);
    }
  };

  if (isLoading) {
    return <div>Loading questions...</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Questions in {bank.title}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button onClick={() => setIsQuestionDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell>{question.title}</TableCell>
                <TableCell>{question.description}</TableCell>
                <TableCell className="text-right space-x-2">
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

        <BankQuestionDialog
          open={isQuestionDialogOpen}
          onOpenChange={setIsQuestionDialogOpen}
          bankId={bank.id}
          questionToEdit={editingQuestion}
          onClose={() => {
            setIsQuestionDialogOpen(false);
            setEditingQuestion(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default QuestionListDialog;