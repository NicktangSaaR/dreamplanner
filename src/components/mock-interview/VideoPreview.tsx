import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StopCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LiveVideoStream from "./video/LiveVideoStream";
import RecordedVideoPlayer from "./video/RecordedVideoPlayer";

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  recordedVideoUrl: string | null;
  isReviewStage: boolean;
  onStopRecording: () => void;
  onStartNew: () => void;
  selectedQuestionId?: string;
}

const VideoPreview = ({
  recordedVideoUrl,
  isReviewStage,
  onStopRecording,
  onStartNew,
  selectedQuestionId
}: VideoPreviewProps) => {
  const queryClient = useQueryClient();

  const handleStopRecording = async () => {
    console.log("Stopping recording and saving video...");
    onStopRecording();

    if (recordedVideoUrl && selectedQuestionId) {
      try {
        console.log("Saving practice record to database...");
        const { error } = await supabase
          .from("interview_practice_records")
          .insert({
            video_url: recordedVideoUrl,
            question_id: selectedQuestionId
          });

        if (error) throw error;

        console.log("Practice record saved successfully");
        queryClient.invalidateQueries({ queryKey: ["practice-records"] });
        toast.success("练习记录已保存");
      } catch (error) {
        console.error("Error saving practice record:", error);
        toast.error("保存练习记录失败");
      }
    }
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