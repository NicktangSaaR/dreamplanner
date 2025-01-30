import { Button } from "@/components/ui/button";
import { RefObject } from "react";

interface DeviceControlsProps {
  isCameraWorking: boolean;
  isAudioWorking: boolean;
  onTest: () => void;
  onComplete: () => void;
  videoRef: RefObject<HTMLVideoElement>;
}

const DeviceControls = ({
  isCameraWorking,
  isAudioWorking,
  onTest,
  onComplete,
  videoRef,
}: DeviceControlsProps) => {
  return (
    <div className="space-y-4">
      <Button 
        onClick={onTest}
        variant="outline"
        className="w-full"
        disabled={isCameraWorking && isAudioWorking}
      >
        测试设备
      </Button>
      <Button
        onClick={onComplete}
        className="w-full"
        disabled={!isCameraWorking || !isAudioWorking}
      >
        完成设置
      </Button>
    </div>
  );
};

export default DeviceControls;