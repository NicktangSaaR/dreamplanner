import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StopCircle } from "lucide-react";
import LiveVideoStream from "./video/LiveVideoStream";
import RecordedVideoPlayer from "./video/RecordedVideoPlayer";
import YouTubeButton from "./video/YouTubeButton";
import { useEffect } from "react";
import { useVideoRecording } from "@/hooks/useVideoRecording";
import { useMediaStreamCleanup } from "@/hooks/useMediaStreamCleanup";
import { toast } from "sonner";

interface VideoPreviewProps {
  recordedVideoUrl: string | null;
  isReviewStage: boolean;
  onStopRecording: () => void;
  onStartNew: () => void;
  selectedQuestionId?: string;
  isRecording: boolean;
  questionTitle?: string;
  bankTitle?: string;
}

const VideoPreview = ({
  recordedVideoUrl,
  isReviewStage,
  onStopRecording,
  onStartNew,
  selectedQuestionId,
  isRecording,
  questionTitle,
  bankTitle
}: VideoPreviewProps) => {
  const { isSaving, saveRecording } = useVideoRecording(selectedQuestionId, questionTitle, bankTitle);
  const {
    stream,
    setStream,
    streamError,
    setStreamError,
    cleanupMediaStream
  } = useMediaStreamCleanup();

  const handleStreamInitialized = (newStream: MediaStream) => {
    console.log("Stream initialized in VideoPreview:", {
      videoTracks: newStream.getVideoTracks().length,
      audioTracks: newStream.getAudioTracks().length
    });

    // Verify both video and audio tracks are present
    if (newStream.getVideoTracks().length === 0 || newStream.getAudioTracks().length === 0) {
      const error = new Error("摄像头或麦克风未正确初始化");
      setStreamError(error.message);
      toast.error("设备初始化失败", {
        description: "请确保摄像头和麦克风都已正确连接并授权使用"
      });
      return;
    }

    setStream(newStream);
    setStreamError(null);
    
    // Verify tracks are active
    newStream.getTracks().forEach(track => {
      if (!track.enabled) {
        console.warn(`${track.kind} track is disabled`);
        track.enabled = true;
      }
    });
  };

  const handleStreamError = (error: Error) => {
    console.error("Stream initialization error:", error);
    setStreamError(error.message);
    toast.error("设备访问错误", {
      description: error.message
    });
  };

  const handleStopRecording = async () => {
    console.log("Stopping recording and saving video...", {
      questionId: selectedQuestionId,
      questionTitle,
      bankTitle,
      recordedVideoUrl
    });
    
    try {
      if (!stream || stream.getTracks().some(track => !track.enabled)) {
        toast.error("录制失败", {
          description: "视频或音频轨道未正确录制"
        });
        return;
      }

      cleanupMediaStream();
      onStopRecording();

      if (recordedVideoUrl && selectedQuestionId) {
        console.log("Starting to save recording with URL:", recordedVideoUrl);
        await saveRecording(recordedVideoUrl);
        toast.success("录制完成", {
          description: "视频正在上传至YouTube，请稍后查看"
        });
      } else {
        console.error("Missing required data for saving:", {
          hasUrl: !!recordedVideoUrl,
          hasQuestionId: !!selectedQuestionId
        });
        toast.error("保存失败", {
          description: "无法保存录制内容，请重试"
        });
      }
    } catch (error) {
      console.error("Error in handleStopRecording:", error);
      toast.error("保存失败", {
        description: "保存录制内容时发生错误，请重试"
      });
    }
  };

  useEffect(() => {
    if (isReviewStage) {
      cleanupMediaStream();
    }
  }, [isReviewStage]);

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
              isRecording={isRecording}
            />
            {streamError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90">
                <p className="text-red-500 text-center p-4">
                  {streamError}
                </p>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-medium">录制中</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex justify-center gap-4">
        {isReviewStage ? (
          <>
            <Button onClick={onStartNew} size="lg" className="text-lg">
              开始新的面试
            </Button>
            {selectedQuestionId && (
              <YouTubeButton questionId={selectedQuestionId} />
            )}
          </>
        ) : (
          isRecording && (
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
          )
        )}
      </div>
    </Card>
  );
};

export default VideoPreview;