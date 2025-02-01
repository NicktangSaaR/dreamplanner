import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StopCircle } from "lucide-react";
import LiveVideoStream from "./video/LiveVideoStream";
import RecordedVideoPlayer from "./video/RecordedVideoPlayer";
import { useEffect } from "react";
import { useVideoRecording } from "@/hooks/useVideoRecording";
import { useMediaStreamCleanup } from "@/hooks/useMediaStreamCleanup";

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
    setStream(newStream);
    setStreamError(null);
  };

  const handleStreamError = (error: Error) => {
    console.error("Stream initialization error:", error);
    setStreamError(error.message);
  };

  const handleStopRecording = async () => {
    console.log("Stopping recording and saving video...", {
      questionId: selectedQuestionId,
      questionTitle,
      bankTitle,
      recordedVideoUrl
    });
    
    try {
      cleanupMediaStream();
      onStopRecording();

      if (recordedVideoUrl && selectedQuestionId) {
        console.log("Starting to save recording with URL:", recordedVideoUrl);
        await saveRecording(recordedVideoUrl);
      } else {
        console.error("Missing required data for saving:", {
          hasUrl: !!recordedVideoUrl,
          hasQuestionId: !!selectedQuestionId
        });
      }
    } catch (error) {
      console.error("Error in handleStopRecording:", error);
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
          <Button onClick={onStartNew} size="lg" className="text-lg">
            开始新的面试
          </Button>
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