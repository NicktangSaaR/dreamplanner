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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuestionBankFormData {
  title: string;
  description: string;
  questions?: string;
}

const QuestionBankForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<QuestionBankFormData>({
    defaultValues: {
      title: "",
      description: "",
      questions: "",
    },
  });

  const onSubmit = async (values: QuestionBankFormData) => {
    try {
      console.log("Creating question bank with values:", values);
      
      const { data: bankData, error: bankError } = await supabase
        .from('mock_interview_questions')
        .insert([{
          title: values.title,
          description: values.description,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (bankError) throw bankError;

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
          Create Question Bank
        </Button>
      </form>
    </Form>
  );
};

export default QuestionBankForm;