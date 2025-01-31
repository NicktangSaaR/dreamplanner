import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const BulkQuestionImport = () => {
  const [questions, setQuestions] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImport = async () => {
    try {
      const questionList = questions
        .split("\n")
        .map(q => q.trim())
        .filter(q => q.length > 0);

      if (questionList.length === 0) {
        toast({
          title: "Error",
          description: "Please enter at least one question.",
          variant: "destructive",
        });
        return;
      }

      const { data: bankData, error: bankError } = await supabase
        .from('mock_interview_questions')
        .insert([{
          title: `Imported Questions (${new Date().toLocaleDateString()})`,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (bankError) throw bankError;

      const bankQuestions = questionList.map(title => ({
        bank_id: bankData.id,
        title,
      }));

      const { error: questionsError } = await supabase
        .from('mock_interview_bank_questions')
        .insert(bankQuestions);

      if (questionsError) throw questionsError;

      await queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      
      toast({
        title: "Success",
        description: `Successfully imported ${questionList.length} questions.`,
      });
      
      setQuestions("");
    } catch (error) {
      console.error("Error importing questions:", error);
      toast({
        title: "Error",
        description: "Failed to import questions. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Bulk Import Questions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Import Questions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter one question per line. These will be imported as a new question bank.
          </p>
          <Textarea
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            placeholder="Enter questions here..."
            rows={10}
          />
          <Button onClick={handleImport} className="w-full">
            Import Questions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkQuestionImport;