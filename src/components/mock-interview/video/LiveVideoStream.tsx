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

  const stopStream = () => {
    console.log("Stopping stream in LiveVideoStream");
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
  };

  const initializeStream = async () => {
    try {
      console.log("Initializing video stream...");
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

      console.log("Stream obtained successfully:", {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("Video playback started");
        onStreamInitialized?.(stream);
      }
    } catch (error) {
      console.error("Error in initializeStream:", error);
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
    console.log("LiveVideoStream component mounted");
    initializeStream().catch(error => {
      console.error("Failed to initialize stream:", error);
    });

    return () => {
      console.log("LiveVideoStream component unmounting");
      stopStream();
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