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

  const initializeVideoStream = async () => {
    try {
      console.log("Initializing video stream...");
      if (videoRef.current) {
        // Stop any existing streams
        if (videoRef.current.srcObject instanceof MediaStream) {
          console.log("Stopping existing stream tracks");
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log("New stream obtained successfully");
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("Video stream started playing");
      }
    } catch (error) {
      console.error("Error initializing video stream:", error);
    }
  };

  useEffect(() => {
    if (!isReviewStage) {
      console.log("Not in review stage, initializing video stream");
      initializeVideoStream();
    }

    return () => {
      // Cleanup function to stop tracks when component unmounts or when entering review stage
      if (videoRef.current?.srcObject instanceof MediaStream) {
        console.log("Cleaning up video stream");
        videoRef.current.srcObject.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
    };
  }, [isReviewStage]); // Re-run when isReviewStage changes

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