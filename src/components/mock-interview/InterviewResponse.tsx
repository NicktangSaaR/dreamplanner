import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface InterviewResponseProps {
  question: {
    title: string;
  };
  timeLeft: number;
  totalTime: number;
}

const InterviewResponse = ({ question, timeLeft, totalTime }: InterviewResponseProps) => {
  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-6">Current Question</h2>
      <p className="text-4xl text-gray-800 mb-8 font-semibold leading-relaxed animate-fade-in">
        {question.title}
      </p>
      <div className="space-y-6">
        <p className="text-2xl font-medium">Response Time</p>
        <Progress value={(timeLeft / totalTime) * 100} className="h-3" />
        <p className="text-center text-3xl font-semibold animate-pulse">
          {timeLeft} seconds remaining
        </p>
      </div>
    </Card>
  );
};

export default InterviewResponse;