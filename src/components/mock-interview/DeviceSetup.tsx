import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Mic, Play, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeviceSetupProps {
  onComplete: () => void;
}

interface StoredDeviceSettings {
  videoDeviceId: string;
  audioDeviceId: string;
  lastUpdated: number;
}

const DEVICE_SETTINGS_KEY = 'interview-device-settings';
const SETTINGS_VALIDITY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const DeviceSetup = ({ onComplete }: DeviceSetupProps) => {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const loadStoredSettings = (): StoredDeviceSettings | null => {
    const storedSettings = localStorage.getItem(DEVICE_SETTINGS_KEY);
    if (!storedSettings) return null;

    const settings: StoredDeviceSettings = JSON.parse(storedSettings);
    const isValid = Date.now() - settings.lastUpdated < SETTINGS_VALIDITY_DURATION;
    
    return isValid ? settings : null;
  };

  const saveDeviceSettings = () => {
    const settings: StoredDeviceSettings = {
      videoDeviceId: selectedVideoDevice,
      audioDeviceId: selectedAudioDevice,
      lastUpdated: Date.now()
    };
    localStorage.setItem(DEVICE_SETTINGS_KEY, JSON.stringify(settings));
  };

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videos = devices.filter(device => device.kind === "videoinput");
        const audios = devices.filter(device => device.kind === "audioinput");
        
        setVideoDevices(videos);
        setAudioDevices(audios);

        const storedSettings = loadStoredSettings();
        
        if (storedSettings && 
            videos.some(d => d.deviceId === storedSettings.videoDeviceId) && 
            audios.some(d => d.deviceId === storedSettings.audioDeviceId)) {
          console.log("Using stored device settings:", storedSettings);
          setSelectedVideoDevice(storedSettings.videoDeviceId);
          setSelectedAudioDevice(storedSettings.audioDeviceId);
          // Automatically start preview with stored settings
          setTimeout(() => startPreview(storedSettings.videoDeviceId, storedSettings.audioDeviceId), 500);
        } else {
          if (videos.length > 0) setSelectedVideoDevice(videos[0].deviceId);
          if (audios.length > 0) setSelectedAudioDevice(audios[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting devices:", error);
        toast({
          title: "设备检测错误",
          description: "无法获取可用的摄像头和麦克风设备列表。",
          variant: "destructive",
        });
      }
    };

    getDevices();
  }, [toast]);

  const startPreview = async (videoId = selectedVideoDevice, audioId = selectedAudioDevice) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: videoId,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          deviceId: audioId,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      setStream(newStream);
      setIsPreviewActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      toast({
        title: "预览开始",
        description: "您现在可以查看摄像头预览并测试麦克风。",
      });
    } catch (error) {
      console.error("Error starting preview:", error);
      toast({
        title: "预览错误",
        description: "无法启动设备预览，请检查设备权限设置。",
        variant: "destructive",
      });
    }
  };

  const startRecording = () => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleComplete = () => {
    saveDeviceSettings();
    onComplete();
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">设备设置</h2>
          <p className="text-gray-600 mb-6">
            请选择并测试您的摄像头和麦克风设备，确保它们在面试过程中能够正常工作。
            {loadStoredSettings() && "您之前的设备设置已自动加载。"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                选择摄像头
              </Label>
              <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="选择摄像头设备" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `摄像头 ${device.deviceId.slice(0, 8)}...`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                选择麦克风
              </Label>
              <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="选择麦克风设备" />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `麦克风 ${device.deviceId.slice(0, 8)}...`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => startPreview()} 
              className="w-full"
              variant={isPreviewActive ? "secondary" : "default"}
            >
              {isPreviewActive ? "重新开始预览" : "开始预览"}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-center gap-4">
                {!isRecording ? (
                  <Button onClick={startRecording} className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    录制测试音频
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                    <StopCircle className="w-4 h-4" />
                    停止录制
                  </Button>
                )}
              </div>
              {audioURL && (
                <audio controls className="w-full mt-4">
                  <source src={audioURL} type="audio/webm" />
                  您的浏览器不支持音频播放。
                </audio>
              )}
            </div>
          </div>
        </div>

        <Button 
          onClick={handleComplete} 
          className="w-full" 
          disabled={!stream}
        >
          完成设置
        </Button>
      </div>
    </Card>
  );
};

export default DeviceSetup;
