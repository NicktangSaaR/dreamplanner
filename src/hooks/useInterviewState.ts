import { useState, useEffect } from "react";
import { InterviewStage } from "@/components/mock-interview/InterviewStage";
import { InterviewSettings } from "@/components/mock-interview/types";

export const useInterviewState = (settings: InterviewSettings) => {
  const [stage, setStage] = useState<InterviewStage>(InterviewStage.SETTINGS);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdownTime, setCountdownTime] = useState(3);

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
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (stage === InterviewStage.RESPONSE && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            console.log("Response time ended, moving to review stage");
            setStage(InterviewStage.REVIEW);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [timeLeft, countdownTime, stage]);

  return {
    stage,
    setStage,
    timeLeft,
    countdownTime
  };
};