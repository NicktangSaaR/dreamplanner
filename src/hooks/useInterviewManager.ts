import { useState } from "react";
import { InterviewStage } from "@/components/mock-interview/InterviewStage";
import { InterviewSettings } from "@/components/mock-interview/types";
import { useInterviewState } from "./useInterviewState";
import { useInterviewQuestions } from "./useInterviewQuestions";
import { DEVICE_SETTINGS_KEY } from "@/components/mock-interview/constants";
import { toast } from "sonner";

export const useInterviewManager = () => {
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
    return Date.now() - settings.lastUpdated < 24 * 60 * 60 * 1000;
  });

  const { stage, setStage, timeLeft, countdownTime } = useInterviewState(settings);
  const {
    initializeQuestions,
    getCurrentQuestion,
    moveToNextQuestion,
    hasMoreQuestions,
    totalQuestions,
    currentQuestionNumber
  } = useInterviewQuestions(settings);

  const selectedQuestion = getCurrentQuestion();

  const handleStartInterview = async () => {
    if (!deviceSetupComplete) {
      toast.error("设备未设置", {
        description: "请先完成设备设置再开始面试。"
      });
      return;
    }

    console.log("Starting interview, initializing questions");
    initializeQuestions();
    setStage(InterviewStage.READY);
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
      console.log("Moving to next question");
      moveToNextQuestion();
      setStage(InterviewStage.READY);
      toast.success("进入下一题", {
        description: "准备时间开始计时。"
      });
    }
  };

  return {
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
    hasMoreQuestions: hasMoreQuestions(),
    handleStartInterview,
    handleDeviceSetupComplete,
    handleNextQuestion
  };
};