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
import { useEffect } from "react";

interface BankQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankId: string;
  questionToEdit: {
    id: string;
    title: string;
    description: string | null;
  } | null;
  onClose: () => void;
}

const BankQuestionDialog = ({
  open,
  onOpenChange,
  bankId,
  questionToEdit,
  onClose,
}: BankQuestionDialogProps) => {
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (questionToEdit) {
      form.reset({
        title: questionToEdit.title,
        description: questionToEdit.description || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
      });
    }
  }, [questionToEdit, form]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (questionToEdit) {
        const { error } = await supabase
          .from('mock_interview_bank_questions')
          .update(values)
          .eq('id', questionToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mock_interview_bank_questions')
          .insert([{ ...values, bank_id: bankId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-questions', bankId] });
      toast.success(
        questionToEdit
          ? "Question updated successfully"
          : "Question added successfully"
      );
      onClose();
    },
    onError: (error) => {
      console.error("Error saving question:", error);
      toast.error("Failed to save question");
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
            {questionToEdit ? "Edit Question" : "Add Question"}
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
            <Button type="submit" className="w-full">
              {questionToEdit ? "Update" : "Add"} Question
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BankQuestionDialog;