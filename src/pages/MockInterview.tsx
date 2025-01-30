import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useInterviewState } from "@/hooks/useInterviewState";
import { useVideoStream } from "@/hooks/useVideoStream";
import { useInterviewQuestions } from "@/hooks/useInterviewQuestions";
import { InterviewSettings } from "@/components/mock-interview/types";
import { InterviewStage } from "@/components/mock-interview/InterviewStage";
import InterviewHeader from "@/components/mock-interview/header/InterviewHeader";
import InterviewContent from "@/components/mock-interview/content/InterviewContent";

// Constants for device settings
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
  const { recordedVideoUrl, startStream, stopRecording } = useVideoStream();

  const {
    initializeQuestions,
    getCurrentQuestion,
    moveToNextQuestion,
    hasMoreQuestions,
    totalQuestions,
    currentQuestionNumber
  } = useInterviewQuestions(settings);

  const selectedQuestion = getCurrentQuestion();

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

    initializeQuestions();
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
    localStorage.setItem(DEVICE_SETTINGS_KEY, JSON.stringify({
      lastUpdated: Date.now()
    }));
    toast.success("设备设置完成", {
      description: "您现在可以开始设置面试参数。"
    });
  };

  const handleNextQuestion = () => {
    if (hasMoreQuestions()) {
      moveToNextQuestion();
      setStage(InterviewStage.PREPARATION);
      toast.success("进入下一题", {
        description: "准备时间开始计时。"
      });
    }
  };

  useEffect(() => {
    if (stage === InterviewStage.REVIEW) {
      console.log("Interview stage changed to REVIEW, stopping recording");
      stopRecording();
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
        recordedVideoUrl={recordedVideoUrl}
        onSettingsChange={setSettings}
        onStartInterview={handleStartInterview}
        onDeviceSetupComplete={handleDeviceSetupComplete}
        onDeviceSetupBack={() => setShowDeviceSetup(false)}
        onStopRecording={() => setStage(InterviewStage.REVIEW)}
        onStartNew={() => setStage(InterviewStage.SETTINGS)}
        currentQuestionNumber={currentQuestionNumber}
        totalQuestions={totalQuestions}
        hasMoreQuestions={hasMoreQuestions()}
        onNextQuestion={handleNextQuestion}
      />
    </div>
  );
};

export default MockInterview;