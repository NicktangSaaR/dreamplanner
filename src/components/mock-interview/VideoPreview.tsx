import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StopCircle } from "lucide-react";
import { useEffect, useRef } from "react";

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  recordedVideoUrl: string | null;
  isReviewStage: boolean;
  onStopRecording: () => void;
  onStartNew: () => void;
}

const VideoPreview = ({
  videoRef,
  recordedVideoUrl,
  isReviewStage,
  onStopRecording,
  onStartNew
}: VideoPreviewProps) => {
  useEffect(() => {
    if (!videoRef.current) {
      console.warn("Video element reference is null");
      return;
    }

    const videoElement = videoRef.current;
    console.log("Video element found, checking stream...");
    
    // Ensure video element is properly configured
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.autoplay = true;
    
    if (videoElement.srcObject) {
      console.log("Stream found, attempting to play");
      const playPromise = videoElement.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log("Video playing successfully"))
          .catch(error => {
            console.error("Error playing video:", error);
            // Retry play after a short delay
            setTimeout(() => {
              videoElement.play()
                .then(() => console.log("Video playing successfully on retry"))
                .catch(e => console.error("Error playing video on retry:", e));
            }, 1000);
          });
      }
    } else {
      console.log("No stream found in video element");
    }
  }, [videoRef]);

  return (
    <Card className="p-6">
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {isReviewStage && recordedVideoUrl ? (
          <video
            src={recordedVideoUrl}
            controls
            className="w-full h-full rounded-lg"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full rounded-lg object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}
      </div>
      <div className="flex justify-center gap-4">
        {isReviewStage ? (
          <Button onClick={onStartNew}>
            开始新的面试
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <StopCircle className="w-4 h-4" />
            结束面试
          </Button>
        )}
      </div>
    </Card>
  );
};

export default VideoPreview;