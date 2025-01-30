import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Home, LogOut, Settings, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import InterviewSettingsComponent from "@/components/mock-interview/InterviewSettings";
import { InterviewStage } from "@/components/mock-interview/InterviewStage";
import InterviewPreparation from "@/components/mock-interview/InterviewPreparation";
import InterviewCountdown from "@/components/mock-interview/InterviewCountdown";
import InterviewResponse from "@/components/mock-interview/InterviewResponse";
import VideoPreview from "@/components/mock-interview/VideoPreview";
import DeviceSetup from "@/components/mock-interview/device-setup/DeviceSetup";
import { useInterviewState } from "@/hooks/useInterviewState";
import { useVideoStream } from "@/hooks/useVideoStream";
import { useProfile } from "@/hooks/useProfile";

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
  const { profile } = useProfile();
  const [settings, setSettings] = useState<InterviewSettings>({
    prepTime: 120,
    responseTime: 180,
    selectedQuestionId: null,
  });

  const [showDeviceSetup, setShowDeviceSetup] = useState(false);
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
      console.log("Logging out...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log("Logged out successfully");
      toast.success("Successfully logged out");
      navigate("/");
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Error logging out");
    }
  };

  const handleBackToSettings = () => {
    if (stage !== InterviewStage.SETTINGS) {
      if (stage === InterviewStage.RESPONSE) {
        stopRecording();
      }
      setStage(InterviewStage.SETTINGS);
      toast.info("已返回面试设置页面");
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
      toast.error("设备未设置", {
        description: "请先完成设备设置再开始面试。"
      });
      return;
    }

    setStage(InterviewStage.PREPARATION);
    
    setTimeout(async () => {
      const success = await startStream();
      if (success) {
        toast.success("面试开始", {
          description: "准备时间开始计时。"
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
      toast.success("面试结束", {
        description: "您现在可以查看录制的视频。"
      });
    }
  }, [stage, stopRecording]);

  const handleDeviceSetupComplete = () => {
    setDeviceSetupComplete(true);
    setShowDeviceSetup(false);
    toast.success("设备设置完成", {
      description: "您现在可以开始设置面试参数。"
    });
  };

  const handleDeviceSetupBack = () => {
    setShowDeviceSetup(false);
  };

  const selectedQuestion = questions.find(q => q.id === settings.selectedQuestionId);

  const renderContent = () => {
    if (showDeviceSetup) {
      return (
        <div className="max-w-4xl mx-auto">
          <DeviceSetup 
            onComplete={handleDeviceSetupComplete} 
            onBack={handleDeviceSetupBack}
          />
        </div>
      );
    }

    if (!deviceSetupComplete) {
      return (
        <div className="max-w-4xl mx-auto">
          <DeviceSetup 
            onComplete={handleDeviceSetupComplete}
            onBack={handleDeviceSetupBack}
          />
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
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-center">Mock Interview Practice</h1>
          <p className="text-gray-600 text-lg">
            Hi, {profile?.full_name || '同学'}
          </p>
        </div>
        <div className="flex gap-4">
          {stage !== InterviewStage.SETTINGS && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10"
              onClick={handleBackToSettings}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Link to="/">
            <Button variant="ghost" size="icon" className="w-10 h-10">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <Link to={`/student-dashboard/${profile?.id}`}>
            <Button variant="ghost" size="icon" className="w-10 h-10">
              <LayoutDashboard className="h-5 w-5" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10"
            onClick={() => setShowDeviceSetup(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
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
