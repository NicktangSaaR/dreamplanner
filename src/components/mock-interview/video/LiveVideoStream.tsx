import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface LiveVideoStreamProps {
  onStreamInitialized?: (stream: MediaStream) => void;
}

const LiveVideoStream = ({ onStreamInitialized }: LiveVideoStreamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const initializeVideoStream = async () => {
    try {
      console.log("Initializing video stream...");
      if (videoRef.current) {
        // Stop any existing streams
        if (videoRef.current.srcObject instanceof MediaStream) {
          console.log("Stopping existing stream tracks");
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }

        console.log("Requesting camera and microphone permissions...");
        const stream = await navigator.mediaDevices.getUserMedia({
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

        console.log("Camera and microphone permissions granted");
        videoRef.current.srcObject = stream;
        
        // Add event listeners to track video element state
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          videoRef.current?.play().catch(error => {
            console.error("Error playing video:", error);
            toast.error("视频播放失败，请刷新页面重试");
          });
        };
        
        videoRef.current.onplay = () => {
          console.log("Video started playing successfully");
          onStreamInitialized?.(stream);
        };

        videoRef.current.onerror = (event) => {
          console.error("Video element error:", event);
          toast.error("视频初始化失败，请检查摄像头权限并刷新页面");
        };

      } else {
        console.error("Video element reference is null");
        toast.error("视频初始化错误，请刷新页面重试");
      }
    } catch (error) {
      console.error("Error initializing video stream:", error);
      let errorMessage = "无法初始化视频预览，请确保允许浏览器访问摄像头和麦克风。";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "请允许浏览器访问摄像头和麦克风";
            break;
          case 'NotFoundError':
            errorMessage = "未找到摄像头或麦克风设备";
            break;
          case 'NotReadableError':
            errorMessage = "无法访问摄像头或麦克风，可能被其他应用程序占用";
            break;
          default:
            errorMessage = "设备访问出错，请确保设备正常工作并重试";
        }
      }
      
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    initializeVideoStream();

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