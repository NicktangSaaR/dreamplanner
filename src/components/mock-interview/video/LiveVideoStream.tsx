import { useEffect } from "react";
import { useVideoStreamSetup } from "@/hooks/useVideoStreamSetup";

interface LiveVideoStreamProps {
  onStreamInitialized?: (stream: MediaStream) => void;
  onStreamError?: (error: Error) => void;
  isRecording?: boolean;
}

const LiveVideoStream = ({ 
  onStreamInitialized,
  onStreamError,
  isRecording = false
}: LiveVideoStreamProps) => {
  const { 
    videoRef, 
    isInitialized,
    initializeStream,
    retryInitialization,
    stopStream
  } = useVideoStreamSetup({
    onStreamInitialized,
    onStreamError
  });

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (!mounted) return;
      
      try {
        console.log("Initializing stream in LiveVideoStream");
        await initializeStream();
      } catch (error) {
        console.error("Error initializing stream in LiveVideoStream:", error);
        if (mounted) {
          retryInitialization();
        }
      }
    };

    init();

    return () => {
      console.log("LiveVideoStream component unmounting");
      mounted = false;
      stopStream();
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full rounded-lg object-cover ${!isInitialized ? 'opacity-0' : 'opacity-100'}`}
        style={{ transform: 'scaleX(-1)' }}
      />
      {!isRecording && isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white text-lg font-medium">
            预览模式
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveVideoStream;