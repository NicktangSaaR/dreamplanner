import { useEffect, useRef } from "react";

interface RecordedVideoPlayerProps {
  recordedVideoUrl: string;
}

const RecordedVideoPlayer = ({ recordedVideoUrl }: RecordedVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (recordedVideoUrl && videoRef.current) {
      console.log("Setting up recorded video playback:", recordedVideoUrl);
      videoRef.current.src = recordedVideoUrl;
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        console.error("Error auto-playing recorded video:", error);
      });
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
      }
    };
  }, [recordedVideoUrl]);

  return (
    <>
      <video
        ref={videoRef}
        controls
        playsInline
        className="w-full h-full rounded-lg object-cover"
      />
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-lg font-medium text-gray-800 bg-white/90 px-4 py-2 rounded-full mx-auto inline-block shadow-lg">
          您可以在此查看和回放录制的视频
        </p>
      </div>
    </>
  );
};

export default RecordedVideoPlayer;