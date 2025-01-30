import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useVideoStream } from "@/hooks/useVideoStream";
import { InterviewStage } from "@/components/mock-interview/InterviewStage";
import InterviewHeader from "@/components/mock-interview/header/InterviewHeader";
import InterviewContent from "@/components/mock-interview/content/InterviewContent";
import { useInterviewManager } from "@/hooks/useInterviewManager";
import { useEffect } from "react";
import { DEVICE_SETTINGS_KEY, SETTINGS_VALIDITY_DURATION } from "@/components/mock-interview/constants";

const MockInterview = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { recordedVideoUrl, startStream, stopRecording } = useVideoStream();
  const {
    settings,
    setSettings,
    showDeviceSetup,
    setShowDeviceSetup,
    deviceSetupComplete,
    stage,
    setStage,
    timeLeft,
    countdownTime,
    selectedQuestion,
    totalQuestions,
    currentQuestionNumber,
    hasMoreQuestions,
    handleStartInterview,
    handleDeviceSetupComplete,
    handleNextQuestion
  } = useInterviewManager();

  // 检查设备设置状态
  useEffect(() => {
    const checkDeviceSetup = () => {
      const storedSettings = localStorage.getItem(DEVICE_SETTINGS_KEY);
      if (!storedSettings) {
        console.log("No device settings found, showing device setup");
        setShowDeviceSetup(true);
        return;
      }

      const settings = JSON.parse(storedSettings);
      const isValid = Date.now() - settings.lastUpdated < SETTINGS_VALIDITY_DURATION;
      
      if (!isValid) {
        console.log("Device settings expired, showing device setup");
        setShowDeviceSetup(true);
      } else {
        console.log("Valid device settings found:", settings);
      }
    };

    checkDeviceSetup();
  }, []);

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

  const handleCleanupMedia = () => {
    console.log("Cleaning up media streams");
    stopRecording();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <InterviewHeader
        profile={profile}
        showBackButton={stage !== InterviewStage.SETTINGS}
        onBackToSettings={() => setStage(InterviewStage.SETTINGS)}
        onShowDeviceSetup={() => setShowDeviceSetup(true)}
        onLogout={handleLogout}
        onCleanupMedia={handleCleanupMedia}
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
        hasMoreQuestions={hasMoreQuestions}
        onNextQuestion={handleNextQuestion}
      />
    </div>
  );
};

export default MockInterview;