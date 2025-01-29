import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface DeviceSetupProps {
  onComplete: () => void;
  onBack?: () => void;
}

const DeviceSetup = ({ onComplete, onBack }: DeviceSetupProps) => {
  const [isCameraWorking, setIsCameraWorking] = useState(false);
  const [isAudioWorking, setIsAudioWorking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsCameraWorking(true);
        setIsAudioWorking(true);
        toast.success("摄像头和麦克风已成功开启");
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
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>摄像头状态：</span>
            <span className={isCameraWorking ? "text-green-500" : "text-red-500"}>
              {isCameraWorking ? "正常" : "未开启"}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>麦克风状态：</span>
            <span className={isAudioWorking ? "text-green-500" : "text-red-500"}>
              {isAudioWorking ? "正常" : "未开启"}
            </span>
          </div>
        </div>

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