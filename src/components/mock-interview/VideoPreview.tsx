import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StopCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const recordedVideoRef = useRef<HTMLVideoElement>(null);

  // Effect to handle recorded video playback
  useEffect(() => {
    if (isReviewStage && recordedVideoUrl && recordedVideoRef.current) {
      console.log("Setting up recorded video playback:", recordedVideoUrl);
      recordedVideoRef.current.src = recordedVideoUrl;
      recordedVideoRef.current.load();
    }
  }, [isReviewStage, recordedVideoUrl]);

  const handleStopRecording = () => {
    onStopRecording();
    navigate(-1);
  };

  return (
    <Card className="p-6">
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
        {isReviewStage && recordedVideoUrl ? (
          <video
            ref={recordedVideoRef}
            controls
            playsInline
            className="w-full h-full rounded-lg"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full rounded-lg object-cover"
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
            onClick={handleStopRecording}
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