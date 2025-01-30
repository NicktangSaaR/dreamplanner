import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { useDeviceSetup } from "./device-setup/useDeviceSetup";
import VideoPreview from "./device-setup/VideoPreview";
import DeviceSelectors from "./device-setup/DeviceSelectors";
import DeviceSetupHeader from "./device-setup/DeviceSetupHeader";
import DeviceSetupActions from "./device-setup/DeviceSetupActions";

interface DeviceSetupProps {
  onComplete: () => void;
  onBack?: () => void;
}

const DeviceSetup = ({ onComplete, onBack }: DeviceSetupProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    isCameraWorking,
    isAudioWorking,
    videoDevices,
    audioDevices,
    selectedVideoDevice,
    selectedAudioDevice,
    setSelectedVideoDevice,
    setSelectedAudioDevice,
    stream,
    startCamera,
    stopDevices
  } = useDeviceSetup();

  const handleComplete = () => {
    stopDevices();
    onComplete();
  };

  const handleBack = () => {
    stopDevices();
    if (onBack) {
      onBack();
    }
  };

  return (
    <Card className="p-6">
      <DeviceSetupHeader onBack={handleBack} />
      
      <div className="space-y-6">
        <VideoPreview videoRef={videoRef} />

        <DeviceSelectors
          videoDevices={videoDevices}
          audioDevices={audioDevices}
          selectedVideoDevice={selectedVideoDevice}
          selectedAudioDevice={selectedAudioDevice}
          onVideoDeviceChange={setSelectedVideoDevice}
          onAudioDeviceChange={setSelectedAudioDevice}
          isCameraWorking={isCameraWorking}
          isAudioWorking={isAudioWorking}
        />

        <DeviceSetupActions
          isCameraWorking={isCameraWorking}
          isAudioWorking={isAudioWorking}
          onStartTest={startCamera}
          onComplete={handleComplete}
        />
      </div>
    </Card>
  );
};

export default DeviceSetup;