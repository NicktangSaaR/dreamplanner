import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StopCircle } from "lucide-react";
import LiveVideoStream from "./video/LiveVideoStream";
import RecordedVideoPlayer from "./video/RecordedVideoPlayer";

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  recordedVideoUrl: string | null;
  isReviewStage: boolean;
  onStopRecording: () => void;
  onStartNew: () => void;
}

const VideoPreview = ({
  recordedVideoUrl,
  isReviewStage,
  onStopRecording,
  onStartNew
}: VideoPreviewProps) => {
  const handleStopRecording = () => {
    console.log("Stopping recording and saving video...");
    onStopRecording();
  };

  return (
    <Card className="p-6">
      <div className="w-full aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
        {isReviewStage && recordedVideoUrl ? (
          <RecordedVideoPlayer recordedVideoUrl={recordedVideoUrl} />
        ) : (
          <LiveVideoStream />
        )}
      </div>
      <div className="flex justify-center gap-4">
        {isReviewStage ? (
          <Button onClick={onStartNew} size="lg" className="text-lg">
            开始新的面试
          </Button>
        ) : (
          <Button
            onClick={handleStopRecording}
            variant="destructive"
            size="lg"
            className="flex items-center gap-2 text-lg"
          >
            <StopCircle className="w-5 h-5" />
            结束面试
          </Button>
        )}
      </div>
    </Card>
  );
};

export default VideoPreview;