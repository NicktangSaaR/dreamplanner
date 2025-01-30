import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { MediaDevice } from "@/types/device";
import VideoPreview from "./device-setup/VideoPreview";
import DeviceSelectors from "./device-setup/DeviceSelectors";
import AudioMeter from "./device-setup/AudioMeter";

interface DeviceSetupProps {
  onComplete: () => void;
  onBack?: () => void;
}

const DeviceSetup = ({ onComplete, onBack }: DeviceSetupProps) => {
  const [isCameraWorking, setIsCameraWorking] = useState(false);
  const [isAudioWorking, setIsAudioWorking] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videos = devices.filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `摄像头 ${videoDevices.length + 1}`
          }));
        
        const audios = devices.filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `麦克风 ${audioDevices.length + 1}`
          }));

        setVideoDevices(videos);
        setAudioDevices(audios);

        if (videos.length > 0) setSelectedVideoDevice(videos[0].deviceId);
        if (audios.length > 0) setSelectedAudioDevice(audios[0].deviceId);

        console.log("Available video devices:", videos);
        console.log("Available audio devices:", audios);
      } catch (error) {
        console.error("Error loading devices:", error);
        toast.error("无法加载设备列表，请确保允许浏览器访问摄像头和麦克风。");
      }
    };

    loadDevices();
  }, []);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      console.log("Starting camera with devices:", {
        video: selectedVideoDevice,
        audio: selectedAudioDevice
      });

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined
        },
        audio: {
          deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined
        }
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsCameraWorking(true);
        setIsAudioWorking(true);
        toast.success("设备测试已开始");
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      let errorMessage = "无法访问摄像头或麦克风。";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "请允许浏览器访问摄像头和麦克风。";
            break;
          case 'NotFoundError':
            errorMessage = "未找到摄像头或麦克风设备。";
            break;
          case 'NotReadableError':
            errorMessage = "无法访问摄像头或麦克风，可能被其他应用程序占用。";
            break;
          default:
            errorMessage = "设备访问出错，请确保设备正常工作并重试。";
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const stopDevices = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      setStream(null);
      setIsCameraWorking(false);
      setIsAudioWorking(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const handleComplete = () => {
    if (!isCameraWorking || !isAudioWorking) {
      toast.error("请先完成设备测试");
      return;
    }
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

        <DeviceSelectors
          videoDevices={videoDevices}
          audioDevices={audioDevices}
          selectedVideoDevice={selectedVideoDevice}
          selectedAudioDevice={selectedAudioDevice}
          onVideoDeviceChange={setSelectedVideoDevice}
          onAudioDeviceChange={setSelectedAudioDevice}
          isCameraWorking={isCameraWorking}
        />

        <AudioMeter
          stream={stream}
          isAudioWorking={isAudioWorking}
        />

        <div className="space-y-4">
          <Button 
            onClick={startCamera} 
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
      </div>
    </Card>
  );
};

export default DeviceSetup;