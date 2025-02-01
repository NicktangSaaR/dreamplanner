import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";
import { useYouTubeVideo } from "@/hooks/useYouTubeVideo";

interface YouTubeButtonProps {
  questionId: string;
}

const YouTubeButton = ({ questionId }: YouTubeButtonProps) => {
  const { openYouTubeVideo } = useYouTubeVideo();

  return (
    <Button 
      onClick={() => openYouTubeVideo(questionId)}
      size="lg" 
      className="flex items-center gap-2 text-lg"
      variant="outline"
    >
      <Youtube className="w-5 h-5" />
      在YouTube上查看
    </Button>
  );
};

export default YouTubeButton;