import { Button } from "@/components/ui/button";

interface DeviceActionsProps {
  onTest: () => void;
  onComplete: () => void;
  isTestingEnabled: boolean;
  isCompleteEnabled: boolean;
}

const DeviceActions = ({ onTest, onComplete, isTestingEnabled, isCompleteEnabled }: DeviceActionsProps) => {
  return (
    <div className="space-y-4">
      <Button 
        onClick={onTest} 
        className="w-full"
        disabled={!isTestingEnabled}
      >
        开始测试
      </Button>
      
      <Button
        onClick={onComplete}
        className="w-full"
        variant="outline"
        disabled={!isCompleteEnabled}
      >
        完成设置
      </Button>
    </div>
  );
};

export default DeviceActions;