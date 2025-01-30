import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
}

const VideoPlayer = ({ videoUrl, onClose }: VideoPlayerProps) => {
  return (
    <Card className="p-4">
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
        <video
          src={videoUrl}
          controls
          className="w-full h-full object-contain"
        />
      </div>
      <Button
        variant="outline"
        className="mt-4"
        onClick={onClose}
      >
        关闭回放
      </Button>
    </Card>
  );
};

export default VideoPlayer;