import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeviceSetupActionsProps {
  isCameraWorking: boolean;
  isAudioWorking: boolean;
  onStartTest: () => void;
  onComplete: () => void;
}

const DeviceSetupActions = ({
  isCameraWorking,
  isAudioWorking,
  onStartTest,
  onComplete
}: DeviceSetupActionsProps) => {
  const handleComplete = () => {
    if (!isCameraWorking || !isAudioWorking) {
      toast.error("请先完成设备测试");
      return;
    }
    onComplete();
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={onStartTest} 
        className="w-full"
        disabled={isCameraWorking && isAudioWorking}
      >
        开始测试
      </Button>
      
      <Button
        onClick={handleComplete}
        className="w-full"
        variant="outline"
        disabled={!isCameraWorking || !isAudioWorking}
      >
        完成设置
      </Button>
    </div>
  );
};

export default DeviceSetupActions;