import { InterviewStage } from "@/components/mock-interview/InterviewStage";
import InterviewSettingsComponent from "@/components/mock-interview/InterviewSettings";
import InterviewPreparation from "@/components/mock-interview/InterviewPreparation";
import InterviewCountdown from "@/components/mock-interview/InterviewCountdown";
import InterviewResponse from "@/components/mock-interview/InterviewResponse";
import ReadyPrompt from "@/components/mock-interview/ReadyPrompt";
import VideoPreview from "@/components/mock-interview/VideoPreview";
import PracticeRecords from "@/components/mock-interview/PracticeRecords";
import DeviceSetup from "@/components/mock-interview/device-setup/DeviceSetup";
import { Question, InterviewSettings } from "@/components/mock-interview/types";
import { Button } from "@/components/ui/button";

interface InterviewContentProps {
  showDeviceSetup: boolean;
  deviceSetupComplete: boolean;
  stage: InterviewStage;
  settings: InterviewSettings;
  selectedQuestion: Question | undefined;
  timeLeft: number;
  countdownTime: number;
  recordedVideoUrl: string | null;
  currentQuestionNumber?: number;
  totalQuestions?: number;
  hasMoreQuestions: boolean;
  onSettingsChange: (settings: InterviewSettings) => void;
  onStartInterview: () => void;
  onDeviceSetupComplete: () => void;
  onDeviceSetupBack: () => void;
  onStopRecording: () => void;
  onStartNew: () => void;
  onNextQuestion: () => void;
  onStartQuestion: () => void;
}

const InterviewContent = ({
  showDeviceSetup,
  deviceSetupComplete,
  stage,
  settings,
  selectedQuestion,
  timeLeft,
  countdownTime,
  recordedVideoUrl,
  currentQuestionNumber = 1,
  totalQuestions = 1,
  hasMoreQuestions,
  onSettingsChange,
  onStartInterview,
  onDeviceSetupComplete,
  onDeviceSetupBack,
  onStopRecording,
  onStartNew,
  onNextQuestion,
  onStartQuestion,
}: InterviewContentProps) => {
  if (showDeviceSetup || !deviceSetupComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <DeviceSetup 
          onComplete={onDeviceSetupComplete} 
          onBack={onDeviceSetupBack}
        />
      </div>
    );
  }

  const renderQuestionProgress = () => {
    if (settings.practiceMode === 'multiple' && stage !== InterviewStage.SETTINGS) {
      return (
        <p className="text-lg text-gray-600 mb-4">
          问题 {currentQuestionNumber} / {totalQuestions}
        </p>
      );
    }
    return null;
  };

  const isRecording = stage === InterviewStage.RESPONSE;

  return (
    <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
      {stage === InterviewStage.SETTINGS ? (
        <>
          <div className="lg:col-span-2">
            <InterviewSettingsComponent
              settings={settings}
              onSettingsChange={onSettingsChange}
              onStartInterview={onStartInterview}
            />
          </div>
          <div className="lg:col-span-2">
            <PracticeRecords />
          </div>
        </>
      ) : selectedQuestion && (
        <>
          <div className="space-y-6">
            {renderQuestionProgress()}
            {stage === InterviewStage.READY && (
              <ReadyPrompt
                questionNumber={currentQuestionNumber}
                totalQuestions={totalQuestions}
                onStart={onStartQuestion}
              />
            )}
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
                <p className="text-xl text-gray-700 mb-6">
                  {settings.practiceMode === 'multiple' && hasMoreQuestions
                    ? "准备进入下一个问题"
                    : "您现在可以查看录制的回答"}
                </p>
                {settings.practiceMode === 'multiple' && hasMoreQuestions && (
                  <Button 
                    onClick={onNextQuestion}
                    className="w-full"
                  >
                    继续下一题
                  </Button>
                )}
              </div>
            )}
          </div>
          <VideoPreview
            recordedVideoUrl={recordedVideoUrl}
            isReviewStage={stage === InterviewStage.REVIEW}
            onStopRecording={onStopRecording}
            onStartNew={onStartNew}
            selectedQuestionId={selectedQuestion.id}
            isRecording={isRecording}
          />
        </>
      )}
    </div>
  );
};

export default InterviewContent;