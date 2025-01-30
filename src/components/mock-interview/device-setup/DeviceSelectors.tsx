import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaDevice } from "@/types/device";
import DeviceStatus from "./DeviceStatus";

interface DeviceSelectorsProps {
  videoDevices: MediaDevice[];
  audioDevices: MediaDevice[];
  selectedVideoDevice: string;
  selectedAudioDevice: string;
  onVideoDeviceChange: (deviceId: string) => void;
  onAudioDeviceChange: (deviceId: string) => void;
  isCameraWorking: boolean;
  isAudioWorking: boolean;
}

const DeviceSelectors = ({
  videoDevices,
  audioDevices,
  selectedVideoDevice,
  selectedAudioDevice,
  onVideoDeviceChange,
  onAudioDeviceChange,
  isCameraWorking,
  isAudioWorking,
}: DeviceSelectorsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <DeviceStatus label="摄像头" isWorking={isCameraWorking} />
        <Select value={selectedVideoDevice} onValueChange={onVideoDeviceChange}>
          <SelectTrigger>
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

      <div className="space-y-2">
        <Select value={selectedAudioDevice} onValueChange={onAudioDeviceChange}>
          <SelectTrigger>
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
    </div>
  );
};

export default DeviceSelectors;