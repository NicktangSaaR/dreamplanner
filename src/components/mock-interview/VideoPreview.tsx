import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StopCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LiveVideoStream from "./video/LiveVideoStream";
import RecordedVideoPlayer from "./video/RecordedVideoPlayer";
import { useEffect, useState } from "react";

interface VideoPreviewProps {
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleStreamInitialized = (newStream: MediaStream) => {
    console.log("Stream initialized in VideoPreview:", {
      videoTracks: newStream.getVideoTracks().length,
      audioTracks: newStream.getAudioTracks().length
    });
    setStream(newStream);
    setStreamError(null);
  };

  const handleStreamError = (error: Error) => {
    console.error("Stream initialization error:", error);
    setStreamError(error.message);
    toast.error("视频初始化失败", {
      description: error.message
    });
  };

  const cleanupMediaStream = () => {
    if (stream) {
      console.log("Cleaning up media stream...");
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track:`, {
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState
        });
      });
      setStream(null);
    }
  };

  const handleStopRecording = async () => {
    console.log("Stopping recording and saving video...");
    setIsSaving(true);
    
    try {
      // First, ensure all media tracks are properly stopped
      cleanupMediaStream();
      
      onStopRecording();

      if (!recordedVideoUrl) {
        throw new Error("No recorded video URL available");
      }

      if (!selectedQuestionId) {
        throw new Error("No question selected");
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      console.log("Saving practice record to database...", {
        videoUrl: recordedVideoUrl,
        questionId: selectedQuestionId,
        userId: session.user.id
      });

      const { error } = await supabase
        .from("interview_practice_records")
        .insert({
          video_url: recordedVideoUrl,
          question_id: selectedQuestionId,
          user_id: session.user.id,
          practice_date: new Date().toISOString()
        });

      if (error) {
        console.error("Database error while saving practice record:", error);
        throw error;
      }

      console.log("Practice record saved successfully");
      await queryClient.invalidateQueries({ queryKey: ["practice-records"] });
      toast.success("练习记录已保存");
    } catch (error) {
      console.error("Error saving practice record:", error);
      toast.error("保存练习记录失败，请重试", {
        description: error instanceof Error ? error.message : "未知错误"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup media stream when component unmounts, when moving to review stage,
  // or when the window/tab is about to be closed
  useEffect(() => {
    if (isReviewStage) {
      cleanupMediaStream();
    }

    // Cleanup when component unmounts
    return () => {
      cleanupMediaStream();
    };
  }, [isReviewStage]);

  // Add cleanup on page unload/visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log("Page visibility changed to hidden, cleaning up media stream...");
        cleanupMediaStream();
      }
    };

    const handleBeforeUnload = () => {
      console.log("Page is being unloaded, cleaning up media stream...");
      cleanupMediaStream();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <Card className="p-6">
      <div className="w-full aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
        {isReviewStage && recordedVideoUrl ? (
          <RecordedVideoPlayer recordedVideoUrl={recordedVideoUrl} />
        ) : (
          <>
            <LiveVideoStream 
              onStreamInitialized={handleStreamInitialized} 
              onStreamError={handleStreamError}
            />
            {streamError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90">
                <p className="text-red-500 text-center p-4">
                  {streamError}
                </p>
              </div>
            )}
          </>
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
            disabled={!!streamError || isSaving}
          >
            <StopCircle className="w-5 h-5" />
            {isSaving ? "保存中..." : "结束面试"}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default VideoPreview;