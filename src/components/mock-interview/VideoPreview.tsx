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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn("Video or canvas element reference is null");
      return;
    }

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d');
    
    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    // Set canvas dimensions to match video
    canvasElement.width = videoElement.clientWidth;
    canvasElement.height = videoElement.clientHeight;
    
    // Function to draw video frame on canvas
    const drawVideoFrame = () => {
      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      }
      requestAnimationFrame(drawVideoFrame);
    };

    // Start drawing frames when video plays
    videoElement.addEventListener('play', () => {
      console.log("Video started playing, beginning frame capture");
      drawVideoFrame();
    });

    // Ensure video element is properly configured
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.autoplay = true;
    
    if (videoElement.srcObject) {
      console.log("Stream found, attempting to play");
      videoElement.play()
        .then(() => console.log("Video playing successfully"))
        .catch(error => {
          console.error("Error playing video:", error);
        });
    } else {
      console.log("No stream found in video element");
    }

    // Cleanup
    return () => {
      videoElement.removeEventListener('play', drawVideoFrame);
    };
  }, [videoRef]);

  const handleStopRecording = () => {
    onStopRecording();
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <Card className="p-6">
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
        {isReviewStage && recordedVideoUrl ? (
          <video
            src={recordedVideoUrl}
            controls
            className="w-full h-full rounded-lg"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full rounded-lg object-cover mirror hidden"
            />
            <canvas
              ref={canvasRef}
              className="w-full h-full rounded-lg object-cover mirror absolute top-0 left-0"
              style={{ transform: 'scaleX(-1)' }}
            />
          </>
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