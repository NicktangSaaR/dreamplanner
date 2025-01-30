import { useRef, useEffect } from "react";
import { useDevices } from "@/hooks/useDevices";
import DeviceHeader from "./DeviceHeader";
import DeviceList from "./DeviceList";
import DeviceControls from "./DeviceControls";
import VideoPreview from "./VideoPreview";
import AudioMeter from "./AudioMeter";
import { useVideoPreview } from "@/hooks/useVideoPreview";
import { toast } from "sonner";

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
    stream,
    getDevices
  } = useDevices();

  useVideoPreview(videoRef, stream);

  const handleComplete = () => {
    if (!isCameraWorking || !isAudioWorking) {
      console.log("Cannot complete setup - devices not working", {
        camera: isCameraWorking,
        audio: isAudioWorking
      });
      toast.error("请先完成设备测试，确保摄像头和麦克风正常工作");
      return;
    }
    console.log("Device setup complete, stopping devices...");
    stopDevices();
    onComplete();
  };

  const handleBack = () => {
    console.log("Navigating back, cleaning up devices...");
    stopDevices();
    onBack();
  };

  useEffect(() => {
    console.log("DeviceSetup component mounted");
    let mounted = true;

    const initDevices = async () => {
      try {
        console.log("Initializing devices...");
        const devices = await getDevices();
        if (devices && mounted) {
          console.log("Devices found, starting initial test...");
          await startDeviceTest();
        }
      } catch (error) {
        console.error("Error initializing devices:", error);
        if (mounted) {
          toast.error("设备初始化失败，请检查设备权限并刷新页面");
        }
      }
    };
    
    initDevices();
    
    return () => {
      console.log("DeviceSetup component unmounting");
      mounted = false;
      stopDevices();
    };
  }, []);

  return (
    <div className="space-y-8">
      <DeviceHeader onBack={handleBack} />

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
          
          <AudioMeter 
            stream={stream}
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
        <div>
          <VideoPreview videoRef={videoRef} />
        </div>
      </div>
    </div>
  );
};

export default DeviceSetup;