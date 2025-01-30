import { useRef } from "react";
import { useDevices } from "@/hooks/useDevices";
import DeviceList from "./DeviceList";
import DeviceControls from "./DeviceControls";
import VideoPreview from "./VideoPreview";

interface DeviceSetupProps {
  onComplete: () => void;
  onBack: () => void;
}

const DeviceSetup = ({ onComplete, onBack }: DeviceSetupProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
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

  const handleComplete = () => {
    console.log("Device setup complete, stopping devices...");
    stopDevices();
    onComplete();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">设备设置</h2>
        <button
          onClick={() => {
            stopDevices();
            onBack();
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          返回
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
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
            onTest={() => {
              console.log("Starting device test...");
              startDeviceTest();
            }}
            onComplete={handleComplete}
            videoRef={videoRef}
          />
        </div>
        <div>
          <VideoPreview videoRef={videoRef} />
        </div>
      </div>
    </div>
  );
};

export default DeviceSetup;