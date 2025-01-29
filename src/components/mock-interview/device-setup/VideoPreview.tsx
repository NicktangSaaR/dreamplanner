import { RefObject } from "react";

interface VideoPreviewProps {
  videoRef: RefObject<HTMLVideoElement>;
}

const VideoPreview = ({ videoRef }: VideoPreviewProps) => {
  return (
    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default VideoPreview;