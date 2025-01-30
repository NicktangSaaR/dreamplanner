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
  const recordedVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // When not in review stage and videoRef exists, ensure video stream is properly connected
    if (!isReviewStage && videoRef.current) {
      console.log("Checking video stream initialization...");
      if (!videoRef.current.srcObject) {
        console.log("Video stream not found, requesting new stream...");
        navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        }).then(stream => {
          console.log("New stream obtained successfully");
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(error => {
              console.error("Error playing new video stream:", error);
            });
          }
        }).catch(error => {
          console.error("Error obtaining new video stream:", error);
        });
      } else {
        console.log("Existing stream found, ensuring playback");
        videoRef.current.play().catch(error => {
          console.error("Error playing existing video stream:", error);
        });
      }
    }
  }, [isReviewStage, videoRef]);

  useEffect(() => {
    if (isReviewStage && recordedVideoUrl && recordedVideoRef.current) {
      console.log("Setting up recorded video playback:", recordedVideoUrl);
      recordedVideoRef.current.src = recordedVideoUrl;
      recordedVideoRef.current.load();
      recordedVideoRef.current.play().catch(error => {
        console.error("Error auto-playing recorded video:", error);
      });
    }
  }, [isReviewStage, recordedVideoUrl]);

  const handleStopRecording = () => {
    console.log("Stopping recording and saving video...");
    onStopRecording();
  };

  return (
    <Card className="p-6">
      <div className="w-full aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
        {isReviewStage && recordedVideoUrl ? (
          <>
            <video
              ref={recordedVideoRef}
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