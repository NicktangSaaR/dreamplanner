import { useState, useCallback } from "react";
import { toast } from "sonner";
import { MediaDevice } from "@/types/device";

export const useDevices = () => {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [isCameraWorking, setIsCameraWorking] = useState(false);
  const [isAudioWorking, setIsAudioWorking] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const getDevices = useCallback(async () => {
    try {
      console.log("Requesting initial device permissions...");
      const initialStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      console.log("Initial permissions granted");

      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("Available devices:", devices);
      
      const videos = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `摄像头 ${videoDevices.length + 1}`
        }));
      
      const audios = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `麦克风 ${audioDevices.length + 1}`
        }));

      console.log("Processed video devices:", videos);
      console.log("Processed audio devices:", audios);

      setVideoDevices(videos);
      setAudioDevices(audios);

      if (videos.length > 0) {
        setSelectedVideoDevice(videos[0].deviceId);
      }
      if (audios.length > 0) {
        setSelectedAudioDevice(audios[0].deviceId);
      }

      initialStream.getTracks().forEach(track => track.stop());
      
      return { videos, audios };
    } catch (error) {
      console.error("Error getting devices:", error);
      let errorMessage = "无法加载设备列表";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "请在浏览器设置中允许访问摄像头和麦克风";
            break;
          case 'NotFoundError':
            errorMessage = "未找到摄像头或麦克风设备";
            break;
          case 'NotReadableError':
            errorMessage = "无法访问摄像头或麦克风，请确认没有其他应用正在使用";
            break;
          default:
            errorMessage = "设备访问出错，请确保设备正常工作并重试";
        }
      }
      
      toast.error(errorMessage);
      return null;
    }
  }, [videoDevices.length, audioDevices.length]);

  const startDeviceTest = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      console.log("Starting camera with devices:", {
        video: selectedVideoDevice,
        audio: selectedAudioDevice
      });

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: {
          deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      setStream(mediaStream);
      setIsCameraWorking(true);
      setIsAudioWorking(true);
      toast.success("设备测试已开始");
      return mediaStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      let errorMessage = "无法访问摄像头或麦克风";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "请在浏览器设置中允许访问摄像头和麦克风";
            break;
          case 'NotFoundError':
            errorMessage = "未找到摄像头或麦克风设备";
            break;
          case 'NotReadableError':
            errorMessage = "无法访问摄像头或麦克风，请确认没有其他应用正在使用";
            break;
          default:
            errorMessage = "设备访问出错，请确保设备正常工作并重试";
        }
      }
      
      toast.error(errorMessage);
      return null;
    }
  };

  const stopDevices = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      setStream(null);
      setIsCameraWorking(false);
      setIsAudioWorking(false);
    }
  };

  return {
    videoDevices,
    audioDevices,
    selectedVideoDevice,
    selectedAudioDevice,
    setSelectedVideoDevice,
    setSelectedAudioDevice,
    isCameraWorking,
    isAudioWorking,
    startDeviceTest,
    stopDevices,
    stream,
    getDevices
  };
};