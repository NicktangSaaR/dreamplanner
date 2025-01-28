import { Card } from "@/components/ui/card";

interface InterviewCountdownProps {
  countdownTime: number;
  question: {
    title: string;
  };
}

const InterviewCountdown = ({ countdownTime, question }: InterviewCountdownProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Current Question</h2>
      <p className="text-gray-600 mb-6">{question.title}</p>
      <div className="text-center">
        <p className="text-4xl font-bold mb-4">Starting in...</p>
        <p className="text-6xl font-bold text-primary">{countdownTime}</p>
      </div>
    </Card>
  );
};

export default InterviewCountdown;