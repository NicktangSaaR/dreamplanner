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
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Current Question</h2>
      <p className="text-gray-600 mb-6">{question.title}</p>
      <div className="space-y-4">
        <p className="text-lg font-medium">Preparation Time</p>
        <Progress value={(timeLeft / totalTime) * 100} />
        <p className="text-center">{timeLeft} seconds remaining</p>
      </div>
    </Card>
  );
};

export default InterviewPreparation;