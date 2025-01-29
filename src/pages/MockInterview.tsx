import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

const DEVICE_SETTINGS_KEY = 'interview-device-settings';
const SETTINGS_VALIDITY_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const MockInterview = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<InterviewSettings>({
    prepTime: 120,
    responseTime: 180,
    selectedQuestionId: null,
  });
  const [deviceSetupComplete, setDeviceSetupComplete] = useState(() => {
    const storedSettings = localStorage.getItem(DEVICE_SETTINGS_KEY);
    if (!storedSettings) return false;
    
    const settings = JSON.parse(storedSettings);
    return Date.now() - settings.lastUpdated < SETTINGS_VALIDITY_DURATION;
  });
  
  const { stage, setStage, timeLeft, countdownTime } = useInterviewState(settings);
  const { videoRef, recordedVideoUrl, startStream, startRecording, stopRecording } = useVideoStream();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Successfully logged out");
      navigate("/");
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Error logging out");
    }
  };

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
        <div className="max-w-4xl mx-auto">
          <DeviceSetup onComplete={handleDeviceSetupComplete} />
        </div>
      );
    }

    return (
      <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {stage === InterviewStage.SETTINGS ? (
          <div className="lg:col-span-2">
            <InterviewSettingsComponent
              settings={settings}
              onSettingsChange={setSettings}
              onStartInterview={startInterview}
            />
          </div>
        ) : selectedQuestion && (
          <>
            <div className="space-y-6">
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
                <div className="card p-8 bg-white rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold mb-6">面试完成</h2>
                  <p className="text-xl text-gray-700 mb-6">您现在可以查看录制的回答。</p>
                  <button
                    onClick={() => {
                      setStage(InterviewStage.SETTINGS);
                    }}
                    className="px-6 py-3 bg-primary text-white rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    开始新的面试
                  </button>
                </div>
              )}
            </div>
            <VideoPreview
              videoRef={videoRef}
              recordedVideoUrl={recordedVideoUrl}
              isReviewStage={stage === InterviewStage.REVIEW}
              onStopRecording={() => setStage(InterviewStage.REVIEW)}
              onStartNew={() => {
                setStage(InterviewStage.SETTINGS);
              }}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-center">模拟面试练习</h1>
        <div className="flex gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="w-10 h-10">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default MockInterview;
