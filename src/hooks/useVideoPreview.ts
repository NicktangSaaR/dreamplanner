import { useEffect, RefObject } from "react";

export const useVideoPreview = (
  videoRef: RefObject<HTMLVideoElement>,
  stream: MediaStream | null
) => {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(error => {
        console.error("Error playing video:", error);
      });
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream, videoRef]);
};