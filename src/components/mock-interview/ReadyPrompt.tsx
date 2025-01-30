import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ReadyPromptProps {
  questionNumber?: number;
  totalQuestions?: number;
  onStart: () => void;
}

const ReadyPrompt = ({ questionNumber, totalQuestions, onStart }: ReadyPromptProps) => {
  return (
    <Card className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-6">准备开始</h2>
      {totalQuestions && questionNumber && (
        <p className="text-lg text-gray-600 mb-4">
          第 {questionNumber} 题 / 共 {totalQuestions} 题
        </p>
      )}
      <p className="text-xl text-gray-800 mb-8">
        请确保您已经准备就绪，点击开始按钮后将进入准备时间
      </p>
      <Button 
        onClick={onStart}
        size="lg"
        className="w-full max-w-md mx-auto text-lg"
      >
        开始面试
      </Button>
    </Card>
  );
};

export default ReadyPrompt;