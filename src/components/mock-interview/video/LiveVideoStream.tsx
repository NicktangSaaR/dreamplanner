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
      
      // Check browser compatibility
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("MediaDevices API not supported");
        toast.error("您的浏览器不支持视频功能，请使用最新版本的Chrome或Firefox");
        return;
      }

      // First check if we can enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
      const hasAudioDevice = devices.some(device => device.kind === 'audioinput');

      if (!hasVideoDevice || !hasAudioDevice) {
        console.error("Required devices not found:", { hasVideoDevice, hasAudioDevice });
        toast.error("未检测到摄像头或麦克风，请确保设备已正确连接");
        return;
      }

      if (videoRef.current) {
        // Stop any existing streams
        if (videoRef.current.srcObject instanceof MediaStream) {
          console.log("Stopping existing stream tracks");
          videoRef.current.srcObject.getTracks().forEach(track => {
            track.stop();
            console.log(`Stopped ${track.kind} track`);
          });
        }

        // Try with basic constraints first
        console.log("Requesting camera and microphone access with basic constraints...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        console.log("Basic camera and microphone access granted, setting up video element");
        videoRef.current.srcObject = stream;
        
        // Set up video element event handlers
        videoRef.current.onloadedmetadata = async () => {
          console.log("Video metadata loaded, attempting to play...");
          try {
            await videoRef.current?.play();
            console.log("Video playback started successfully");
            onStreamInitialized?.(stream);
          } catch (error) {
            console.error("Error starting video playback:", error);
            toast.error("视频播放失败，请检查设备权限并刷新页面");
          }
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
            errorMessage = "请允许浏览器访问摄像头和麦克风，并刷新页面重试";
            break;
          case 'NotFoundError':
            errorMessage = "未找到摄像头或麦克风设备，请确保设备已正确连接";
            break;
          case 'NotReadableError':
            errorMessage = "无法访问摄像头或麦克风，可能被其他应用程序占用";
            break;
          case 'OverconstrainedError':
            errorMessage = "摄像头不支持请求的视频设置，请刷新页面重试";
            break;
          case 'SecurityError':
            errorMessage = "访问媒体设备被安全策略阻止，请检查浏览器设置";
            break;
          default:
            errorMessage = "设备访问出错，请确保设备正常工作并重试";
        }
      }
      
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    console.log("LiveVideoStream component mounted, initializing stream...");
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