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
      // First, check if we already have a stream and clean it up
      if (stream) {
        console.log("Cleaning up existing stream");
        stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped existing ${track.kind} track`);
        });
      }

      console.log("Requesting camera and microphone access...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      console.log("Camera and microphone access granted successfully");
      
      // Check if all tracks are active
      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];
      
      if (!videoTrack || !videoTrack.enabled) {
        throw new Error("Video track is not available");
      }
      
      if (!audioTrack || !audioTrack.enabled) {
        console.warn("Audio track might not be available");
      }
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        console.log("Setting video stream to video element");
        videoRef.current.srcObject = mediaStream;
        
        try {
          await videoRef.current.play();
          console.log("Video preview started playing");
        } catch (playError) {
          console.error("Error playing video:", playError);
          toast({
            title: "视频播放错误",
            description: "无法播放视频预览，请检查浏览器权限设置并刷新页面重试。",
            variant: "destructive",
          });
        }
      } else {
        console.warn("Video element reference not found");
        toast({
          title: "视频初始化错误",
          description: "无法初始化视频预览，请刷新页面重试。",
          variant: "destructive",
        });
      }

      return true;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      let errorMessage = "无法访问摄像头或麦克风。";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage += "请检查浏览器权限设置。";
            break;
          case 'NotFoundError':
            errorMessage += "未找到摄像头或麦克风设备。";
            break;
          case 'NotReadableError':
            errorMessage += "摄像头或麦克风可能被其他应用程序占用。";
            break;
          default:
            errorMessage += "请确保设备正常工作并重试。";
        }
      }
      
      toast({
        title: "设备访问错误",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const startRecording = () => {
    if (stream) {
      try {
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
          const videoUrl = URL.createObjectURL(blob);
          setRecordedVideoUrl(videoUrl);

          // Create and trigger download
          const downloadLink = document.createElement('a');
          downloadLink.href = videoUrl;
          downloadLink.download = `面试录制_${new Date().toLocaleString()}.webm`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          toast({
            title: "录制完成",
            description: "面试视频已自动下载到您的设备中。",
          });
        };

        mediaRecorder.start();
        setIsRecording(true);
        console.log("Recording started successfully");
      } catch (error) {
        console.error("Error starting recording:", error);
        toast({
          title: "录制错误",
          description: "开始录制时发生错误，请刷新页面重试。",
          variant: "destructive",
        });
      }
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
        console.log(`Stopped ${track.kind} track`);
      });
      setStream(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Cleaned up ${track.kind} track`);
        });
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