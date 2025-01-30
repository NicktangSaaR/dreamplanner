import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Question {
  id: string;
  title: string;
  description: string | null;
  preparation_time: number;
  response_time: number;
  is_system: boolean;
}

interface InterviewSettings {
  prepTime: number;
  responseTime: number;
  selectedQuestionId: string | null;
}

interface InterviewSettingsProps {
  settings: InterviewSettings;
  onSettingsChange: (settings: InterviewSettings) => void;
  onStartInterview: () => void;
}

const InterviewSettings = ({ settings, onSettingsChange, onStartInterview }: InterviewSettingsProps) => {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      preparation_time: 120,
      response_time: 180,
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['interview-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mock_interview_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Question[];
    },
  });

  const systemQuestions = questions.filter(q => q.is_system);
  const customQuestions = questions.filter(q => !q.is_system);

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
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Interview Settings</h2>
      <div className="space-y-6">
        <div>
          <Label>Preparation Time (seconds)</Label>
          <Input
            type="number"
            value={settings.prepTime}
            onChange={(e) => onSettingsChange({
              ...settings,
              prepTime: parseInt(e.target.value)
            })}
            min={30}
            max={300}
          />
        </div>
        <div>
          <Label>Response Time (seconds)</Label>
          <Input
            type="number"
            value={settings.responseTime}
            onChange={(e) => onSettingsChange({
              ...settings,
              responseTime: parseInt(e.target.value)
            })}
            min={60}
            max={600}
          />
        </div>
        <div>
          <Label className="mb-2 block">Select Question Bank</Label>
          <Select
            value={settings.selectedQuestionId || ""}
            onValueChange={(value) => onSettingsChange({
              ...settings,
              selectedQuestionId: value
            })}
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
                      <SelectItem key={question.id} value={question.id}>
                        {question.title}
                      </SelectItem>
                    ))}
                  </div>
                )}
                {customQuestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold px-2 py-1.5 text-sm text-muted-foreground">
                      Custom Questions
                    </div>
                    {customQuestions.map((question) => (
                      <SelectItem key={question.id} value={question.id}>
                        {question.title}
                      </SelectItem>
                    ))}
                  </div>
                )}
              </div>
            </SelectContent>
          </Select>
        </div>
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
        <Button
          onClick={onStartInterview}
          className="w-full"
          disabled={!settings.selectedQuestionId}
        >
          Start Interview
        </Button>
      </div>
    </Card>
  );
};

export default InterviewSettings;