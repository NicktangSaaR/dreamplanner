import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useInterviewState } from "@/hooks/useInterviewState";
import { useVideoStream } from "@/hooks/useVideoStream";
import { useProfile } from "@/hooks/useProfile";
import { Question, InterviewSettings } from "@/components/mock-interview/types";
import InterviewHeader from "@/components/mock-interview/header/InterviewHeader";
import InterviewContent from "@/components/mock-interview/content/InterviewContent";

const DEVICE_SETTINGS_KEY = 'interview-device-settings';
const SETTINGS_VALIDITY_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const MockInterview = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [settings, setSettings] = useState<InterviewSettings>({
    prepTime: 120,
    responseTime: 180,
    selectedQuestionId: null,
    practiceMode: 'single',
    questionOrder: 'sequential',
    numberOfQuestions: 2,
  });

  const [showDeviceSetup, setShowDeviceSetup] = useState(false);
  const [deviceSetupComplete, setDeviceSetupComplete] = useState(() => {
    const storedSettings = localStorage.getItem(DEVICE_SETTINGS_KEY);
    if (!storedSettings) return false;
    const settings = JSON.parse(storedSettings);
    return Date.now() - settings.lastUpdated < SETTINGS_VALIDITY_DURATION;
  });

  const { stage, setStage, timeLeft, countdownTime } = useInterviewState(settings);
  const { videoRef, recordedVideoUrl, startStream, stopRecording } = useVideoStream();

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

  const selectedQuestion = questions.find(q => q.id === settings.selectedQuestionId);

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

  const handleStartInterview = async () => {
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

  const handleDeviceSetupComplete = () => {
    setDeviceSetupComplete(true);
    setShowDeviceSetup(false);
    toast.success("设备设置完成", {
      description: "您现在可以开始设置面试参数。"
    });
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

  return (
    <div className="container mx-auto px-4 py-8">
      <InterviewHeader
        profile={profile}
        showBackButton={stage !== InterviewStage.SETTINGS}
        onBackToSettings={() => setStage(InterviewStage.SETTINGS)}
        onShowDeviceSetup={() => setShowDeviceSetup(true)}
        onLogout={handleLogout}
      />
      <InterviewContent
        showDeviceSetup={showDeviceSetup}
        deviceSetupComplete={deviceSetupComplete}
        stage={stage}
        settings={settings}
        selectedQuestion={selectedQuestion}
        timeLeft={timeLeft}
        countdownTime={countdownTime}
        videoRef={videoRef}
        recordedVideoUrl={recordedVideoUrl}
        onSettingsChange={setSettings}
        onStartInterview={handleStartInterview}
        onDeviceSetupComplete={handleDeviceSetupComplete}
        onDeviceSetupBack={() => setShowDeviceSetup(false)}
        onStopRecording={() => setStage(InterviewStage.REVIEW)}
        onStartNew={() => setStage(InterviewStage.SETTINGS)}
      />
    </div>
  );
};

export default MockInterview;