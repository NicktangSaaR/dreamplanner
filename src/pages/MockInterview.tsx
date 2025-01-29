import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import InterviewSettingsComponent from "@/components/mock-interview/InterviewSettings";
import { InterviewStage } from "@/components/mock-interview/InterviewStage";
import InterviewPreparation from "@/components/mock-interview/InterviewPreparation";
import InterviewCountdown from "@/components/mock-interview/InterviewCountdown";
import InterviewResponse from "@/components/mock-interview/InterviewResponse";
import VideoPreview from "@/components/mock-interview/VideoPreview";
import DeviceSetup from "@/components/mock-interview/DeviceSetup";
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
  const [deviceSetupComplete, setDeviceSetupComplete] = useState(false);
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
    if (!deviceSetupComplete) {
      toast({
        title: "设备未设置",
        description: "请先完成设备设置再开始面试。",
        variant: "destructive",
      });
      return;
    }

    setStage(InterviewStage.PREPARATION);
    
    setTimeout(async () => {
      const success = await startStream();
      if (success) {
        toast({
          title: "面试开始",
          description: "准备时间开始计时。",
        });
      } else {
        setStage(InterviewStage.SETTINGS);
      }
    }, 100);
  };

  // 监听面试阶段变化，当进入REVIEW阶段时自动停止录制
  useEffect(() => {
    if (stage === InterviewStage.REVIEW) {
      console.log("Interview stage changed to REVIEW, stopping recording");
      stopRecording();
      toast({
        title: "面试结束",
        description: "您现在可以查看录制的视频。",
      });
    }
  }, [stage, stopRecording, toast]);

  const handleDeviceSetupComplete = () => {
    setDeviceSetupComplete(true);
    toast({
      title: "设备设置完成",
      description: "您现在可以开始设置面试参数。",
    });
  };

  const selectedQuestion = questions.find(q => q.id === settings.selectedQuestionId);

  const renderContent = () => {
    if (!deviceSetupComplete) {
      return (
        <div className="max-w-3xl mx-auto">
          <DeviceSetup onComplete={handleDeviceSetupComplete} />
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-8">
        {stage === InterviewStage.SETTINGS ? (
          <InterviewSettingsComponent
            settings={settings}
            onSettingsChange={setSettings}
            onStartInterview={startInterview}
          />
        ) : selectedQuestion && (
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
                <h2 className="text-xl font-semibold mb-4">面试完成</h2>
                <p>您现在可以查看录制的回答。</p>
                <button
                  onClick={() => {
                    setStage(InterviewStage.SETTINGS);
                    setDeviceSetupComplete(false);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  开始新的面试
                </button>
              </div>
            )}
          </>
        )}
        <VideoPreview
          videoRef={videoRef}
          recordedVideoUrl={recordedVideoUrl}
          isReviewStage={stage === InterviewStage.REVIEW}
          onStopRecording={() => setStage(InterviewStage.REVIEW)}
          onStartNew={() => {
            setStage(InterviewStage.SETTINGS);
            setDeviceSetupComplete(false);
          }}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">模拟面试练习</h1>
      {renderContent()}
    </div>
  );
};

export default MockInterview;