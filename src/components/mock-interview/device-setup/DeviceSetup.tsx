import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useDevices } from "@/hooks/useDevices";
import { useVideoPreview } from "@/hooks/useVideoPreview";
import VideoPreview from "./VideoPreview";
import DeviceList from "./DeviceList";
import DeviceControls from "./DeviceControls";

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
    stream
  } = useDevices();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  useVideoPreview(videoRef, stream);

  const handleComplete = () => {
    if (!isCameraWorking || !isAudioWorking) {
      toast.error("请先完成设备测试");
      return;
    }
    
    console.log("Stopping devices before completing setup...");
    stopDevices();
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

        <DeviceList
          videoDevices={videoDevices}
          audioDevices={audioDevices}
          selectedVideoDevice={selectedVideoDevice}
          selectedAudioDevice={selectedAudioDevice}
          onVideoDeviceChange={setSelectedVideoDevice}
          onAudioDeviceChange={setSelectedAudioDevice}
          isCameraWorking={isCameraWorking}
          isAudioWorking={isAudioWorking}
        />

        <DeviceControls
          isCameraWorking={isCameraWorking}
          isAudioWorking={isAudioWorking}
          onTest={startDeviceTest}
          onComplete={handleComplete}
          videoRef={videoRef}
        />
      </div>
    </Card>
  );
};

export default DeviceSetup;