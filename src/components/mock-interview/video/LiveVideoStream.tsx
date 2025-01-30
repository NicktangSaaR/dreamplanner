import { useVideoStreamSetup } from "@/hooks/useVideoStreamSetup";

interface LiveVideoStreamProps {
  onStreamInitialized?: (stream: MediaStream) => void;
  onStreamError?: (error: Error) => void;
}

const LiveVideoStream = ({ 
  onStreamInitialized,
  onStreamError 
}: LiveVideoStreamProps) => {
  const { videoRef, isInitialized } = useVideoStreamSetup({
    onStreamInitialized,
    onStreamError
  });

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`w-full h-full rounded-lg object-cover ${!isInitialized ? 'opacity-0' : 'opacity-100'}`}
      style={{ transform: 'scaleX(-1)' }}
    />
  );
};

export default LiveVideoStream;