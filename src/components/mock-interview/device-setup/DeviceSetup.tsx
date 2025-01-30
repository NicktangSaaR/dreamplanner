import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import DeviceSelector from "./DeviceSelector";
import DeviceStatus from "./DeviceStatus";
import VideoPreview from "./VideoPreview";
import DeviceActions from "./DeviceActions";
import { useDevices } from "@/hooks/useDevices";

interface DeviceSetupProps {
  onComplete: () => void;
  onBack?: () => void;
}

const DeviceSetup = ({ onComplete, onBack }: DeviceSetupProps) => {
  const {
    videoDevices,
    audioDevices,
    selectedVideoDevice,
    selectedAudioDevice,
    setSelectedVideoDevice,
    setSelectedAudioDevice,
    isCameraWorking,
    isAudioWorking,
    startDeviceTest,
    stopDevices,
  } = useDevices();
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleComplete = () => {
    if (!isCameraWorking || !isAudioWorking) {
      toast.error("请先完成设备测试");
      return;
    }
    
    console.log("Stopping devices before completing setup...");
    stopDevices();
    
    // Clear video element's source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    toast.success("设备设置完成");
    onComplete();
  };

  const handleBack = () => {
    console.log("Stopping devices before going back...");
    stopDevices();
    if (onBack) {
      onBack();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("DeviceSetup unmounting, cleaning up devices...");
      stopDevices();
    };
  }, [stopDevices]);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">设备设置</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="w-10 h-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="space-y-6">
        <VideoPreview videoRef={videoRef} />

        <div className="space-y-4">
          <DeviceSelector
            label="摄像头"
            devices={videoDevices}
            selectedDevice={selectedVideoDevice}
            onDeviceChange={setSelectedVideoDevice}
          />
          
          <DeviceSelector
            label="麦克风"
            devices={audioDevices}
            selectedDevice={selectedAudioDevice}
            onDeviceChange={setSelectedAudioDevice}
          />

          <DeviceStatus label="摄像头" isWorking={isCameraWorking} />
          <DeviceStatus label="麦克风" isWorking={isAudioWorking} />
        </div>

        <DeviceActions
          onTest={() => startDeviceTest(videoRef)}
          onComplete={handleComplete}
          isTestingEnabled={!isCameraWorking || !isAudioWorking}
          isCompleteEnabled={isCameraWorking && isAudioWorking}
        />
      </div>
    </Card>
  );
};

export default DeviceSetup;