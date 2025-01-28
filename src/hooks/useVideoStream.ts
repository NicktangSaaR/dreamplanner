import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const useVideoStream = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: true,
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log("Video stream obtained:", mediaStream.id);
        console.log("Video tracks:", mediaStream.getVideoTracks().length);
        console.log("Audio tracks:", mediaStream.getAudioTracks().length);
      }

      return true;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Camera Access Error",
        description: "Unable to access camera or microphone. Please check your permissions and make sure no other app is using your camera.",
        variant: "destructive",
      });
      return false;
    }
  };

  const startRecording = () => {
    if (stream) {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedChunks(chunks);
        setRecordedVideoUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log("Recording stopped");
      setIsRecording(false);
    }
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return {
    isRecording,
    recordedVideoUrl,
    videoRef,
    startStream,
    startRecording,
    stopRecording
  };
};