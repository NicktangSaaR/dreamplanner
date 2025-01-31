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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface QuestionBankFormData {
  title: string;
  description: string;
}

const QuestionBankForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<QuestionBankFormData>({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (values: QuestionBankFormData) => {
    try {
      const { error } = await supabase
        .from('mock_interview_questions')
        .insert([{
          title: values.title,
          description: values.description,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }]);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      
      toast({
        title: "Success",
        description: "Question bank created successfully.",
      });
      
      form.reset();
    } catch (error) {
      console.error("Error creating question bank:", error);
      toast({
        title: "Error",
        description: "Failed to create question bank. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <Button type="submit">Create Question Bank</Button>
      </form>
    </Form>
  );
};

export default QuestionBankForm;