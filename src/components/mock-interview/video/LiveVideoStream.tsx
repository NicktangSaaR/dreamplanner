import { useEffect, useRef } from "react";

interface LiveVideoStreamProps {
  onStreamInitialized?: (stream: MediaStream) => void;
  onStreamError?: (error: Error) => void;
}

const LiveVideoStream = ({ 
  onStreamInitialized,
  onStreamError 
}: LiveVideoStreamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checkPermissions = async () => {
    try {
      console.log("Checking device permissions...");
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoPermission = devices.some(device => device.kind === 'videoinput' && device.label);
      const hasAudioPermission = devices.some(device => device.kind === 'audioinput' && device.label);
      
      console.log("Current device permissions:", {
        video: hasVideoPermission,
        audio: hasAudioPermission
      });

      if (!hasVideoPermission || !hasAudioPermission) {
        console.log("Requesting permissions explicitly...");
        const tempStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        tempStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped temporary ${track.kind} track`);
        });
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
      throw new Error("请在浏览器设置中允许访问摄像头和麦克风");
    }
  };

  const initializeVideoStream = async () => {
    try {
      await checkPermissions();
      console.log("Starting video stream initialization...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          frameRate: { min: 15, ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      console.log("Media stream obtained successfully");
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("Video playback started successfully");
        onStreamInitialized?.(stream);
      }
    } catch (error) {
      console.error("Error in initializeVideoStream:", error);
      let errorMessage = "无法访问摄像头或麦克风";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "请在浏览器设置中允许访问摄像头和麦克风，然后刷新页面重试";
            break;
          case 'NotFoundError':
            errorMessage = "未找到摄像头或麦克风设备，请确保设备已正确连接";
            break;
          case 'NotReadableError':
            errorMessage = "无法访问摄像头或麦克风，请确认没有其他应用正在使用这些设备";
            break;
          case 'OverconstrainedError':
            errorMessage = "您的设备不支持所需的视频设置，请尝试使用其他设备";
            break;
          default:
            errorMessage = "设备访问出错，请确保设备正常工作并刷新页面重试";
        }
      }
      
      const finalError = new Error(errorMessage);
      onStreamError?.(finalError);
      throw finalError;
    }
  };

  const cleanup = () => {
    console.log("Cleaning up video stream...");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track:`, {
          label: track.label,
          kind: track.kind
        });
      });
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
    }
  };

  useEffect(() => {
    console.log("LiveVideoStream component mounted");
    initializeVideoStream().catch(error => {
      console.error("Failed to initialize video stream:", error);
      cleanup();
      onStreamError?.(error);
    });

    return cleanup;
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