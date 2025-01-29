import { Card } from "@/components/ui/card";

interface InterviewCountdownProps {
  countdownTime: number;
  question: {
    title: string;
  };
}

const InterviewCountdown = ({ countdownTime, question }: InterviewCountdownProps) => {
  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-6">Current Question</h2>
      <p className="text-2xl text-gray-800 mb-8 font-medium leading-relaxed">{question.title}</p>
      <div className="text-center">
        <p className="text-4xl font-bold mb-6">Starting in...</p>
        <p className="text-7xl font-bold text-primary animate-pulse">{countdownTime}</p>
      </div>
    </Card>
  );
};

export default InterviewCountdown;