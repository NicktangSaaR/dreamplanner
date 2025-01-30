import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AddQuestionDialog = () => {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      preparation_time: 120,
      response_time: 180,
    },
  });

  const onSubmitQuestion = async (values: any) => {
    try {
      const { error } = await supabase
        .from('mock_interview_questions')
        .insert([{
          title: values.title,
          description: values.description,
          preparation_time: values.preparation_time,
          response_time: values.response_time,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your question has been added to the question bank.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add your question. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Question
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Interview Question</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitQuestion)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Title</FormLabel>
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
                  <FormLabel>Description (Optional)</FormLabel>
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
                    <Input type="number" {...field} min={30} max={300} />
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
                    <Input type="number" {...field} min={60} max={600} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Add Question</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuestionDialog;