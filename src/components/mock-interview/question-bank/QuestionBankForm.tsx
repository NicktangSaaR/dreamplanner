import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Question } from "../types";
import { useEffect } from "react";

interface QuestionBankFormData {
  title: string;
  description: string;
  questions?: string;
  preparation_time: number;
  response_time: number;
}

interface QuestionBankFormProps {
  questionToEdit: Question | null;
  onClose: () => void;
}

const QuestionBankForm = ({ questionToEdit, onClose }: QuestionBankFormProps) => {
  const queryClient = useQueryClient();
  const form = useForm<QuestionBankFormData>({
    defaultValues: {
      title: "",
      description: "",
      questions: "",
      preparation_time: 120,
      response_time: 180,
    },
  });

  useEffect(() => {
    if (questionToEdit) {
      form.reset({
        title: questionToEdit.title,
        description: questionToEdit.description || "",
        preparation_time: questionToEdit.preparation_time,
        response_time: questionToEdit.response_time,
        questions: questionToEdit.mock_interview_bank_questions
          ?.map(q => q.title)
          .join('\n') || "",
      });
    }
  }, [questionToEdit, form]);

  const onSubmit = async (values: QuestionBankFormData) => {
    try {
      console.log("Submitting question bank with values:", values);
      
      if (questionToEdit) {
        // Update existing question bank
        const { error: updateError } = await supabase
          .from('mock_interview_questions')
          .update({
            title: values.title,
            description: values.description,
            preparation_time: values.preparation_time,
            response_time: values.response_time,
          })
          .eq('id', questionToEdit.id);

        if (updateError) throw updateError;

        // Delete existing questions
        const { error: deleteError } = await supabase
          .from('mock_interview_bank_questions')
          .delete()
          .eq('bank_id', questionToEdit.id);

        if (deleteError) throw deleteError;
      }

      // Create new question bank or add questions to edited bank
      const bankId = questionToEdit?.id;
      
      if (!bankId) {
        const { data: bankData, error: bankError } = await supabase
          .from('mock_interview_questions')
          .insert([{
            title: values.title,
            description: values.description,
            preparation_time: values.preparation_time,
            response_time: values.response_time,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          }])
          .select()
          .single();

        if (bankError) throw bankError;
        
        if (bankData) {
          // If there are questions to import
          if (values.questions) {
            const questionList = values.questions
              .split("\n")
              .map(q => q.trim())
              .filter(q => q.length > 0);

            if (questionList.length > 0) {
              const bankQuestions = questionList.map(title => ({
                bank_id: bankData.id,
                title,
              }));

              const { error: questionsError } = await supabase
                .from('mock_interview_bank_questions')
                .insert(bankQuestions);

              if (questionsError) throw questionsError;
            }
          }
        }
      } else if (values.questions) {
        // Add new questions to edited bank
        const questionList = values.questions
          .split("\n")
          .map(q => q.trim())
          .filter(q => q.length > 0);

        if (questionList.length > 0) {
          const bankQuestions = questionList.map(title => ({
            bank_id: bankId,
            title,
          }));

          const { error: questionsError } = await supabase
            .from('mock_interview_bank_questions')
            .insert(bankQuestions);

          if (questionsError) throw questionsError;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      
      toast.success(
        questionToEdit
          ? "Question bank updated successfully"
          : "Question bank created successfully"
      );
      
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error saving question bank:", error);
      toast.error("Failed to save question bank");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Bank Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preparation_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preparation Time (seconds)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="response_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Time (seconds)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-4">
            <FormField
              control={form.control}
              name="questions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Questions (One per line)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter questions here..."
                      rows={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
        
        <Button type="submit" className="w-full">
          {questionToEdit ? "Update" : "Create"} Question Bank
        </Button>
      </form>
    </Form>
  );
};

export default QuestionBankForm;