import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Mic, Play, StopCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
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

enum InterviewStage {
  SETTINGS,
  PREPARATION,
  COUNTDOWN,
  RESPONSE,
  REVIEW
}

const MockInterview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<InterviewStage>(InterviewStage.SETTINGS);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdownTime, setCountdownTime] = useState(3);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [settings, setSettings] = useState<InterviewSettings>({
    prepTime: 120,
    responseTime: 180,
    selectedQuestionId: null,
  });
  const { toast } = useToast();

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

  useEffect(() => {
    if (stage === InterviewStage.PREPARATION) {
      setTimeLeft(settings.prepTime);
    } else if (stage === InterviewStage.COUNTDOWN) {
      setCountdownTime(3);
    } else if (stage === InterviewStage.RESPONSE) {
      setTimeLeft(settings.responseTime);
    }
  }, [stage, settings]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (stage === InterviewStage.PREPARATION && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setStage(InterviewStage.COUNTDOWN);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (stage === InterviewStage.COUNTDOWN && countdownTime > 0) {
      timer = setInterval(() => {
        setCountdownTime(prev => {
          if (prev <= 1) {
            setStage(InterviewStage.RESPONSE);
            startRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (stage === InterviewStage.RESPONSE && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopRecording();
            setStage(InterviewStage.REVIEW);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [timeLeft, countdownTime, stage]);

  const startInterview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStage(InterviewStage.PREPARATION);
      toast({
        title: "Interview Started",
        description: "Preparation time has begun.",
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

  const startRecording = () => {
    if (stream) {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedChunks(chunks);
        setRecordedVideoUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
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

  const renderContent = () => {
    if (stage === InterviewStage.SETTINGS) {
      return (
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
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Question</h2>
          {selectedQuestion && (
            <>
              <p className="text-gray-600 mb-6">{selectedQuestion.title}</p>
              {stage === InterviewStage.PREPARATION && (
                <div className="space-y-4">
                  <p className="text-lg font-medium">Preparation Time</p>
                  <Progress value={(timeLeft / settings.prepTime) * 100} />
                  <p className="text-center">{timeLeft} seconds remaining</p>
                </div>
              )}
              {stage === InterviewStage.COUNTDOWN && (
                <div className="text-center">
                  <p className="text-4xl font-bold mb-4">Starting in...</p>
                  <p className="text-6xl font-bold text-primary">{countdownTime}</p>
                </div>
              )}
              {stage === InterviewStage.RESPONSE && (
                <div className="space-y-4">
                  <p className="text-lg font-medium">Response Time</p>
                  <Progress value={(timeLeft / settings.responseTime) * 100} />
                  <p className="text-center">{timeLeft} seconds remaining</p>
                </div>
              )}
            </>
          )}
        </Card>

        <Card className="p-6">
          <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
            {stage === InterviewStage.REVIEW && recordedVideoUrl ? (
              <video
                src={recordedVideoUrl}
                controls
                className="w-full h-full rounded-lg"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full rounded-lg"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}
          </div>
          <div className="flex justify-center gap-4">
            {stage === InterviewStage.REVIEW ? (
              <Button onClick={() => setStage(InterviewStage.SETTINGS)}>
                Start New Interview
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                End Interview
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mock Interview Practice</h1>
      {renderContent()}
    </div>
  );
};

export default MockInterview;
