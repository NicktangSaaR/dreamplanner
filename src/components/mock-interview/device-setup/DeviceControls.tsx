import { Button } from "@/components/ui/button";
import { RefObject } from "react";

interface DeviceControlsProps {
  isCameraWorking: boolean;
  isAudioWorking: boolean;
  onTest: (videoRef: RefObject<HTMLVideoElement>) => void;
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
        onClick={() => onTest(videoRef)} 
        className="w-full"
        disabled={isCameraWorking && isAudioWorking}
      >
        开始测试
      </Button>
      
      <Button
        onClick={onComplete}
        className="w-full"
        variant="outline"
        disabled={!isCameraWorking || !isAudioWorking}
      >
        完成设置
      </Button>
    </div>
  );
};

export default DeviceControls;