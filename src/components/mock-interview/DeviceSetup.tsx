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
        console.log("Requesting initial device permissions...");
        // First request permissions with specific constraints
        const initialStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        console.log("Initial permissions granted");

        // Then enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("Available devices:", devices);
        
        const videos = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `摄像头 ${videoDevices.length + 1}`
          }));
        
        const audios = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `麦克风 ${audioDevices.length + 1}`
          }));

        console.log("Processed video devices:", videos);
        console.log("Processed audio devices:", audios);

        setVideoDevices(videos);
        setAudioDevices(audios);

        if (videos.length > 0) {
          setSelectedVideoDevice(videos[0].deviceId);
        }
        if (audios.length > 0) {
          setSelectedAudioDevice(audios[0].deviceId);
        }

        // Stop the initial stream since we'll create a new one with selected devices
        initialStream.getTracks().forEach(track => track.stop());
        
        // Automatically start camera after device enumeration
        if (videos.length > 0 && audios.length > 0) {
          setTimeout(startCamera, 500); // Small delay to ensure state is updated
        }
      } catch (error) {
        console.error("Error loading devices:", error);
        let errorMessage = "无法加载设备列表";
        
        if (error instanceof DOMException) {
          switch (error.name) {
            case 'NotAllowedError':
              errorMessage = "请在浏览器设置中允许访问摄像头和麦克风";
              break;
            case 'NotFoundError':
              errorMessage = "未找到摄像头或麦克风设备";
              break;
            case 'NotReadableError':
              errorMessage = "无法访问摄像头或麦克风，请确认没有其他应用正在使用";
              break;
            default:
              errorMessage = "设备访问出错，请确保设备正常工作并重试";
          }
        }
        
        toast.error(errorMessage);
      }
    };

    loadDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
      stopDevices();
    };
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
          deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: {
          deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsCameraWorking(true);
        setIsAudioWorking(true);
        toast.success("设备测试已开始");
      } else {
        throw new Error("视频预览元素未找到");
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      let errorMessage = "无法访问摄像头或麦克风";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "请在浏览器设置中允许访问摄像头和麦克风";
            break;
          case 'NotFoundError':
            errorMessage = "未找到摄像头或麦克风设备";
            break;
          case 'NotReadableError':
            errorMessage = "无法访问摄像头或麦克风，请确认没有其他应用正在使用";
            break;
          default:
            errorMessage = "设备访问出错，请确保设备正常工作并重试";
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
          isAudioWorking={isAudioWorking}
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