import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaDevice } from "@/types/device";

interface DeviceSelectorsProps {
  videoDevices: MediaDevice[];
  audioDevices: MediaDevice[];
  selectedVideoDevice: string;
  selectedAudioDevice: string;
  onVideoDeviceChange: (deviceId: string) => void;
  onAudioDeviceChange: (deviceId: string) => void;
  isCameraWorking: boolean;
}

const DeviceSelectors = ({
  videoDevices,
  audioDevices,
  selectedVideoDevice,
  selectedAudioDevice,
  onVideoDeviceChange,
  onAudioDeviceChange,
  isCameraWorking,
}: DeviceSelectorsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span>摄像头：</span>
        <Select value={selectedVideoDevice} onValueChange={onVideoDeviceChange}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="选择摄像头" />
          </SelectTrigger>
          <SelectContent>
            {videoDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center justify-between">
        <span>麦克风：</span>
        <Select value={selectedAudioDevice} onValueChange={onAudioDeviceChange}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="选择麦克风" />
          </SelectTrigger>
          <SelectContent>
            {audioDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <span>摄像头状态：</span>
        <span className={isCameraWorking ? "text-green-500" : "text-red-500"}>
          {isCameraWorking ? "正常" : "未开启"}
        </span>
      </div>
    </div>
  );
};

export default DeviceSelectors;