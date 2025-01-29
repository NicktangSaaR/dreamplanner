import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Question {
  title: string;
  description: string | null;
}

interface InterviewPreparationProps {
  question: Question;
  timeLeft: number;
  totalTime: number;
}

const InterviewPreparation = ({ question, timeLeft, totalTime }: InterviewPreparationProps) => {
  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-6">Current Question</h2>
      <p className="text-2xl text-gray-800 mb-8 font-medium leading-relaxed">{question.title}</p>
      {question.description && (
        <p className="text-lg text-gray-600 mb-8">{question.description}</p>
      )}
      <div className="space-y-6">
        <p className="text-xl font-medium">Preparation Time</p>
        <Progress value={(timeLeft / totalTime) * 100} className="h-3" />
        <p className="text-center text-2xl font-semibold">{timeLeft} seconds remaining</p>
      </div>
    </Card>
  );
};

export default InterviewPreparation;