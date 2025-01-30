import { useRef, useEffect, useState } from "react";

interface VideoStreamConfig {
  onStreamInitialized?: (stream: MediaStream) => void;
  onStreamError?: (error: Error) => void;
}

export const useVideoStreamSetup = ({ 
  onStreamInitialized, 
  onStreamError 
}: VideoStreamConfig) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const stopStream = () => {
    console.log("Stopping video stream");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track:`, track.label);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsInitialized(false);
  };

  const initializeStream = async () => {
    try {
      console.log("Requesting media stream...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log("Media stream obtained:", {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return;
          videoRef.current.onloadedmetadata = () => resolve();
        });

        await videoRef.current.play();
        console.log("Video playback started");
        setIsInitialized(true);
        onStreamInitialized?.(stream);
      } else {
        throw new Error("Video element reference not found");
      }
    } catch (error) {
      console.error("Stream initialization error:", error);
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
          default:
            errorMessage = "设备访问出错，请确保设备正常工作并刷新页面重试";
        }
      }
      
      const finalError = new Error(errorMessage);
      onStreamError?.(finalError);
      throw finalError;
    }
  };

  useEffect(() => {
    console.log("Setting up video stream");
    let mounted = true;

    const init = async () => {
      if (mounted) {
        await initializeStream().catch(error => {
          console.error("Failed to initialize stream:", error);
        });
      }
    };

    init();

    return () => {
      console.log("Cleaning up video stream");
      mounted = false;
      stopStream();
    };
  }, []);

  return {
    videoRef,
    isInitialized,
    stopStream
  };
};