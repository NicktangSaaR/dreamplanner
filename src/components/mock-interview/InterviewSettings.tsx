import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Question, InterviewSettings as Settings } from "./types";
import TimeSettings from "./settings/TimeSettings";
import QuestionBankSelect from "./question-bank/QuestionBankSelect";
import PracticeModeSettings from "./settings/PracticeModeSettings";
import { DEVICE_SETTINGS_KEY } from "./constants";
import { toast } from "sonner";
import BulkQuestionImport from "./question-bank/BulkQuestionImport";

interface InterviewSettingsProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onStartInterview: () => void;
}

const InterviewSettings = ({ 
  settings, 
  onSettingsChange, 
  onStartInterview 
}: InterviewSettingsProps) => {
  const handleStartInterview = () => {
    const storedSettings = localStorage.getItem(DEVICE_SETTINGS_KEY);
    if (!storedSettings) {
      toast.error("请先完成设备设置", {
        description: "开始面试前需要进行设备检测"
      });
      return;
    }

    if (!settings.selectedQuestionId) {
      toast.error("请选择面试题目", {
        description: "开始面试前需要选择一个题目"
      });
      return;
    }

    onStartInterview();
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Interview Settings</h2>
      <div className="space-y-6">
        <TimeSettings
          prepTime={settings.prepTime}
          responseTime={settings.responseTime}
          onPrepTimeChange={(time) => onSettingsChange({
            ...settings,
            prepTime: time
          })}
          onResponseTimeChange={(time) => onSettingsChange({
            ...settings,
            responseTime: time
          })}
        />
        <QuestionBankSelect
          selectedQuestionId={settings.selectedQuestionId}
          onQuestionSelect={(questionId) => onSettingsChange({
            ...settings,
            selectedQuestionId: questionId
          })}
        />
        <PracticeModeSettings
          practiceMode={settings.practiceMode}
          questionOrder={settings.questionOrder}
          numberOfQuestions={settings.numberOfQuestions}
          onPracticeModeChange={(mode) => onSettingsChange({
            ...settings,
            practiceMode: mode
          })}
          onQuestionOrderChange={(order) => onSettingsChange({
            ...settings,
            questionOrder: order
          })}
          onNumberOfQuestionsChange={(num) => onSettingsChange({
            ...settings,
            numberOfQuestions: num
          })}
        />
        <BulkQuestionImport />
        <Button
          onClick={handleStartInterview}
          className="w-full"
          disabled={!settings.selectedQuestionId}
        >
          Start Interview
        </Button>
      </div>
    </Card>
  );
};

export default InterviewSettings;