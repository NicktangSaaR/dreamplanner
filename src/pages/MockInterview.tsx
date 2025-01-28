import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Mic, Play, StopCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface InterviewSettings {
  prepTime: number;
  responseTime: number;
  selectedQuestionId: string | null;
}

interface Question {
  id: string;
  title: string;
  description: string | null;
  preparation_time: number;
  response_time: number;
  is_system: boolean;
}

const MockInterview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState<InterviewSettings>({
    prepTime: 120,
    responseTime: 180,
    selectedQuestionId: null,
  });
  const { toast } = useToast();

  // Fetch questions from Supabase
  const { data: questions = [], isLoading } = useQuery({
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

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      preparation_time: 120,
      response_time: 180,
    },
  });

  const startInterview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setIsRecording(true);
      setShowSettings(false);
      toast({
        title: "Interview Started",
        description: "Your camera and microphone are now active.",
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Error",
        description: "Unable to access camera or microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopInterview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsRecording(false);
      setShowSettings(true);
      toast({
        title: "Interview Ended",
        description: "Your recording has been stopped.",
      });
    }
  };

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

  const selectedQuestion = questions.find(q => q.id === settings.selectedQuestionId);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mock Interview Practice</h1>

      {showSettings ? (
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Interview Settings</h2>
            <div className="space-y-6">
              <div>
                <Label>Preparation Time (seconds)</Label>
                <Input
                  type="number"
                  value={settings.prepTime}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    prepTime: parseInt(e.target.value)
                  }))}
                  min={30}
                  max={300}
                />
              </div>
              <div>
                <Label>Response Time (seconds)</Label>
                <Input
                  type="number"
                  value={settings.responseTime}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    responseTime: parseInt(e.target.value)
                  }))}
                  min={60}
                  max={600}
                />
              </div>
              <div>
                <Label className="mb-2 block">Select Question</Label>
                <RadioGroup
                  value={settings.selectedQuestionId || ""}
                  onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    selectedQuestionId: value
                  }))}
                >
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <div key={question.id} className="flex items-start space-x-3">
                        <RadioGroupItem value={question.id} id={question.id} />
                        <div>
                          <Label htmlFor={question.id}>{question.title}</Label>
                          {question.description && (
                            <p className="text-sm text-gray-500">{question.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
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
                onClick={startInterview}
                className="w-full"
                disabled={!settings.selectedQuestionId}
              >
                Start Interview
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Selected Question</h2>
            {selectedQuestion ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{selectedQuestion.title}</h3>
                {selectedQuestion.description && (
                  <p className="text-gray-600">{selectedQuestion.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mic className="w-4 h-4" />
                  <span>{settings.prepTime} seconds to prepare</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Video className="w-4 h-4" />
                  <span>{settings.responseTime} seconds to respond</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Please select a question to begin the interview.</p>
            )}
          </Card>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Current Question</h2>
            {selectedQuestion && (
              <>
                <p className="text-gray-600 mb-6">{selectedQuestion.title}</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mic className="w-4 h-4" />
                    <span>{settings.prepTime} seconds to prepare</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Video className="w-4 h-4" />
                    <span>{settings.responseTime} seconds to respond</span>
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card className="p-6">
            <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              {stream ? (
                <video
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full rounded-lg"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <Video className="w-12 h-12 mb-2" />
                  <span>Camera preview will appear here</span>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <Button
                  onClick={startInterview}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopInterview}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop Recording
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MockInterview;