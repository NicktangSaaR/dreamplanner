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
      if (stream) {
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
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log("Setting video source object");
        try {
          await videoRef.current.play();
          console.log("Video preview started successfully");
        } catch (error) {
          console.error("Error playing video:", error);
          toast({
            title: "视频播放错误",
            description: "无法播放视频预览，请检查浏览器权限设置。",
            variant: "destructive",
          });
        }
      } else {
        console.error("Video element reference is null");
      }

      return true;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      let errorMessage = "无法访问摄像头或麦克风。";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "请允许浏览器访问摄像头和麦克风。";
            break;
          case 'NotFoundError':
            errorMessage = "未找到摄像头或麦克风设备。";
            break;
          case 'NotReadableError':
            errorMessage = "无法访问摄像头或麦克风，可能被其他应用程序占用。";
            break;
          default:
            errorMessage = "设备访问出错，请确保设备正常工作并重试。";
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
    if (!stream) {
      console.error("No media stream available");
      return;
    }

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