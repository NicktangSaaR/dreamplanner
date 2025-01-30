import { useState, useEffect, RefObject } from "react";
import { toast } from "sonner";

interface MediaDevice {
  deviceId: string;
  label: string;
}

export const useDevices = () => {
  const [isCameraWorking, setIsCameraWorking] = useState(false);
  const [isAudioWorking, setIsAudioWorking] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Request permissions to get device labels
        const initialStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // Stop the initial stream immediately after getting permissions
        initialStream.getTracks().forEach(track => track.stop());
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videos = devices.filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `摄像头 ${videoDevices.length + 1}`
          }));
        
        const audios = devices.filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `麦克风 ${audioDevices.length + 1}`
          }));

        setVideoDevices(videos);
        setAudioDevices(audios);

        if (videos.length > 0) setSelectedVideoDevice(videos[0].deviceId);
        if (audios.length > 0) setSelectedAudioDevice(audios[0].deviceId);

        console.log("Available video devices:", videos);
        console.log("Available audio devices:", audios);
      } catch (error) {
        console.error("Error loading devices:", error);
        toast.error("无法加载设备列表，请确保允许浏览器访问摄像头和麦克风。");
      }
    };

    loadDevices();
  }, []);

  const startDeviceTest = async (videoRef: RefObject<HTMLVideoElement>) => {
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped existing ${track.kind} track`);
        });
      }

      console.log("Starting device test with selected devices:", {
        video: selectedVideoDevice,
        audio: selectedAudioDevice
      });

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined
        },
        audio: {
          deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined
        }
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsCameraWorking(true);
        setIsAudioWorking(true);
        toast.success("设备测试已开始");
      }
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
      
      toast.error(errorMessage);
    }
  };

  const stopDevices = () => {
    console.log("Stopping all media tracks...");
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
    stream, // Added stream to the return value
  };
};