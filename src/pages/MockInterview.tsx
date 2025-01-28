import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import InterviewSettingsComponent from "@/components/mock-interview/InterviewSettings";
import { InterviewStage } from "@/components/mock-interview/InterviewStage";
import InterviewPreparation from "@/components/mock-interview/InterviewPreparation";
import InterviewCountdown from "@/components/mock-interview/InterviewCountdown";
import InterviewResponse from "@/components/mock-interview/InterviewResponse";
import VideoPreview from "@/components/mock-interview/VideoPreview";

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
        console.log("Setting video stream:", mediaStream);
        
        // Ensure video starts playing
        try {
          await videoRef.current.play();
          console.log("Video started playing successfully");
        } catch (playError) {
          console.error("Error playing video:", playError);
        }
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

  const selectedQuestion = questions.find(q => q.id === settings.selectedQuestionId);

  const renderContent = () => {
    if (stage === InterviewStage.SETTINGS) {
      return (
        <div className="grid md:grid-cols-2 gap-8">
          <InterviewSettingsComponent
            settings={settings}
            onSettingsChange={setSettings}
            onStartInterview={startInterview}
          />
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-8">
        {selectedQuestion && (
          <>
            {stage === InterviewStage.PREPARATION && (
              <InterviewPreparation
                question={selectedQuestion}
                timeLeft={timeLeft}
                totalTime={settings.prepTime}
              />
            )}
            {stage === InterviewStage.COUNTDOWN && (
              <InterviewCountdown
                countdownTime={countdownTime}
                question={selectedQuestion}
              />
            )}
            {stage === InterviewStage.RESPONSE && (
              <InterviewResponse
                question={selectedQuestion}
                timeLeft={timeLeft}
                totalTime={settings.responseTime}
              />
            )}
            {stage === InterviewStage.REVIEW && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Interview Complete</h2>
                <p>You can now review your recorded response.</p>
              </div>
            )}
          </>
        )}
        <VideoPreview
          videoRef={videoRef}
          recordedVideoUrl={recordedVideoUrl}
          isReviewStage={stage === InterviewStage.REVIEW}
          onStopRecording={stopRecording}
          onStartNew={() => setStage(InterviewStage.SETTINGS)}
        />
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