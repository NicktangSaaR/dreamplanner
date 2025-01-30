import { useState, useEffect, useCallback } from "react";
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
      // First request permissions to ensure we get labeled devices
      const initialStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      console.log("Got initial permission stream");
      
      // Enumerate devices after getting permissions
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoInputs = devices
        .filter(device => device.kind === "videoinput")
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
        }));
      
      const audioInputs = devices
        .filter(device => device.kind === "audioinput")
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`
        }));

      console.log("Found video devices:", videoInputs);
      console.log("Found audio devices:", audioInputs);

      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);

      if (videoInputs.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }

      // Stop the initial permission stream
      initialStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error("Error getting devices:", error);
      toast.error("获取设备列表失败");
    }
  }, [selectedVideoDevice, selectedAudioDevice]);

  const stopDevices = useCallback(() => {
    console.log("Stopping all media tracks...");
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
      setStream(null);
    }
    setIsCameraWorking(false);
    setIsAudioWorking(false);
  }, [stream]);

  const startDeviceTest = useCallback(async () => {
    console.log("Starting device test with selected devices:", {
      video: selectedVideoDevice,
      audio: selectedAudioDevice
    });

    try {
      // Stop any existing streams
      stopDevices();

      const constraints = {
        video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
      };

      console.log("Requesting media with constraints:", constraints);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log("Got new media stream:", newStream);
      setStream(newStream);
      
      // Check video tracks
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        console.log("Video track obtained:", videoTrack.label);
        setIsCameraWorking(true);
      }

      // Check audio tracks
      const audioTrack = newStream.getAudioTracks()[0];
      if (audioTrack) {
        console.log("Audio track obtained:", audioTrack.label);
        setIsAudioWorking(true);
      }

      toast.success("设备测试成功");
      return newStream;
    } catch (error) {
      console.error("Error testing devices:", error);
      toast.error("设备测试失败，请检查设备权限设置");
      setIsCameraWorking(false);
      setIsAudioWorking(false);
      return null;
    }
  }, [selectedVideoDevice, selectedAudioDevice, stopDevices]);

  useEffect(() => {
    getDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
      stopDevices();
    };
  }, [getDevices, stopDevices]);

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
  };
};