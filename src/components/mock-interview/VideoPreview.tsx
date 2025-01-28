import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StopCircle } from "lucide-react";
import { useEffect } from "react";

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
  // Add useEffect to handle stream changes
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      console.log("Video stream updated:", videoRef.current.srcObject);
    }
  }, [videoRef]);

  return (
    <Card className="p-6">
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
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
            className="w-full h-full rounded-lg"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}
      </div>
      <div className="flex justify-center gap-4">
        {isReviewStage ? (
          <Button onClick={onStartNew}>
            Start New Interview
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <StopCircle className="w-4 h-4" />
            End Interview
          </Button>
        )}
      </div>
    </Card>
  );
};

export default VideoPreview;