import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Question, InterviewSettings as Settings } from "./types";
import TimeSettings from "./settings/TimeSettings";
import QuestionBankSelect from "./settings/QuestionBankSelect";
import AddQuestionDialog from "./settings/AddQuestionDialog";
import PracticeModeSettings from "./settings/PracticeModeSettings";

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
          questions={questions}
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
        <AddQuestionDialog />
        <Button
          onClick={onStartInterview}
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