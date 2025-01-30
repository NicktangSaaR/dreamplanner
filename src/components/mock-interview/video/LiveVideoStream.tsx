import { useEffect, useRef } from "react";

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

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log("New stream obtained successfully");
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("Video stream started playing");
        onStreamInitialized?.(stream);
      }
    } catch (error) {
      console.error("Error initializing video stream:", error);
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