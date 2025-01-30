import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Question } from "@/components/mock-interview/types";
import { useEffect } from "react";

interface QuestionBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionToEdit: Question | null;
  onClose: () => void;
}

const QuestionBankDialog = ({
  open,
  onOpenChange,
  questionToEdit,
  onClose,
}: QuestionBankDialogProps) => {
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      preparation_time: 120,
      response_time: 180,
      is_system: false,
    },
  });

  useEffect(() => {
    if (questionToEdit) {
      form.reset({
        title: questionToEdit.title,
        description: questionToEdit.description || "",
        preparation_time: questionToEdit.preparation_time,
        response_time: questionToEdit.response_time,
        is_system: questionToEdit.is_system || false,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        preparation_time: 120,
        response_time: 180,
        is_system: false,
      });
    }
  }, [questionToEdit, form]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (questionToEdit) {
        const { error } = await supabase
          .from('mock_interview_questions')
          .update(values)
          .eq('id', questionToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mock_interview_questions')
          .insert([values]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-question-banks'] });
      toast.success(
        questionToEdit
          ? "Question bank updated successfully"
          : "Question bank created successfully"
      );
      onClose();
    },
    onError: (error) => {
      console.error("Error saving question bank:", error);
      toast.error("Failed to save question bank");
    },
  });

  const onSubmit = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {questionToEdit ? "Edit Question Bank" : "Add Question Bank"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
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
            <Button type="submit" className="w-full">
              {questionToEdit ? "Update" : "Create"} Question Bank
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionBankDialog;