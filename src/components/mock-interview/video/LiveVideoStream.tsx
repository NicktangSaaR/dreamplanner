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
  const { videoRef, isInitialized } = useVideoStreamSetup({
    onStreamInitialized,
    onStreamError
  });

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