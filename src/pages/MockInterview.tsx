import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import InterviewSettingsComponent from "@/components/mock-interview/InterviewSettings";
import { InterviewStage } from "@/components/mock-interview/InterviewStage";
import InterviewPreparation from "@/components/mock-interview/InterviewPreparation";
import InterviewCountdown from "@/components/mock-interview/InterviewCountdown";
import InterviewResponse from "@/components/mock-interview/InterviewResponse";
import VideoPreview from "@/components/mock-interview/VideoPreview";
import { useInterviewState } from "@/hooks/useInterviewState";
import { useVideoStream } from "@/hooks/useVideoStream";

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
  const [settings, setSettings] = useState<InterviewSettings>({
    prepTime: 120,
    responseTime: 180,
    selectedQuestionId: null,
  });

  const { toast } = useToast();
  const { stage, setStage, timeLeft, countdownTime } = useInterviewState(settings);
  const { videoRef, recordedVideoUrl, startStream, startRecording, stopRecording } = useVideoStream();

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

  const startInterview = async () => {
    const success = await startStream();
    if (success) {
      setStage(InterviewStage.PREPARATION);
      toast({
        title: "Interview Started",
        description: "Preparation time has begun.",
      });
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