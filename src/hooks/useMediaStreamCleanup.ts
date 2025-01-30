import { useEffect, useState } from "react";

export const useMediaStreamCleanup = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

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
      cleanupMediaStream();
    };
  }, [stream]);

  return {
    stream,
    setStream,
    streamError,
    setStreamError,
    cleanupMediaStream
  };
};