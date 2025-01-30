import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface LiveVideoStreamProps {
  onStreamInitialized?: (stream: MediaStream) => void;
}

const LiveVideoStream = ({ onStreamInitialized }: LiveVideoStreamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const initializeVideoStream = async () => {
    try {
      console.log("Starting video stream initialization...");
      
      // First try to get existing permissions
      const permissions = await navigator.mediaDevices.enumerateDevices();
      console.log("Current device permissions:", permissions);

      // Try to access the stream directly
      console.log("Attempting to access media stream...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log("Successfully obtained media stream");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            console.log("Video playback started successfully");
            onStreamInitialized?.(stream);
          } catch (error) {
            console.error("Error starting video playback:", error);
            toast.error("视频播放失败，请尝试刷新页面");
          }
        };

        videoRef.current.onerror = (event) => {
          console.error("Video element error:", event);
          toast.error("视频初始化失败，请刷新页面重试");
        };
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      let errorMessage = "无法访问摄像头或麦克风。";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "请在浏览器设置中确认已允许访问摄像头和麦克风";
            break;
          case 'NotFoundError':
            errorMessage = "未找到摄像头或麦克风设备";
            break;
          case 'NotReadableError':
            errorMessage = "无法访问摄像头或麦克风，请确认没有其他应用正在使用";
            break;
          case 'OverconstrainedError':
            errorMessage = "摄像头不支持请求的视频设置";
            break;
          case 'SecurityError':
            errorMessage = "访问被安全策略阻止，请检查浏览器设置";
            break;
          default:
            errorMessage = "设备访问出错，请刷新页面重试";
        }
      }
      
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    console.log("LiveVideoStream component mounted");
    const init = async () => {
      await initializeVideoStream();
    };
    init();

    return () => {
      if (videoRef.current?.srcObject instanceof MediaStream) {
        console.log("Cleaning up video stream");
        videoRef.current.srcObject.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full rounded-lg object-cover"
      style={{ transform: 'scaleX(-1)' }}
    />
  );
};

export default LiveVideoStream;