import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface PracticeModeSettingsProps {
  practiceMode: 'single' | 'multiple';
  questionOrder: 'sequential' | 'random';
  numberOfQuestions: number;
  onPracticeModeChange: (mode: 'single' | 'multiple') => void;
  onQuestionOrderChange: (order: 'sequential' | 'random') => void;
  onNumberOfQuestionsChange: (num: number) => void;
}

const PracticeModeSettings = ({
  practiceMode,
  questionOrder,
  numberOfQuestions,
  onPracticeModeChange,
  onQuestionOrderChange,
  onNumberOfQuestionsChange,
}: PracticeModeSettingsProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>练习模式</Label>
        <RadioGroup
          value={practiceMode}
          onValueChange={(value) => onPracticeModeChange(value as 'single' | 'multiple')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="single" id="single" />
            <Label htmlFor="single">单题练习</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="multiple" id="multiple" />
            <Label htmlFor="multiple">连续多题练习</Label>
          </div>
        </RadioGroup>
      </div>

      {practiceMode === 'multiple' && (
        <>
          <div className="space-y-2">
            <Label>题目数量</Label>
            <Input
              type="number"
              min={2}
              max={10}
              value={numberOfQuestions}
              onChange={(e) => onNumberOfQuestionsChange(parseInt(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>随机出题顺序</Label>
            <Switch
              checked={questionOrder === 'random'}
              onCheckedChange={(checked) => 
                onQuestionOrderChange(checked ? 'random' : 'sequential')
              }
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PracticeModeSettings;