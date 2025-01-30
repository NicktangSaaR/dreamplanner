import { MediaDevice } from "@/types/device";
import DeviceSelector from "./DeviceSelector";
import DeviceStatus from "./DeviceStatus";

interface DeviceListProps {
  videoDevices: MediaDevice[];
  audioDevices: MediaDevice[];
  selectedVideoDevice: string;
  selectedAudioDevice: string;
  onVideoDeviceChange: (deviceId: string) => void;
  onAudioDeviceChange: (deviceId: string) => void;
  isCameraWorking: boolean;
  isAudioWorking: boolean;
}

const DeviceList = ({
  videoDevices,
  audioDevices,
  selectedVideoDevice,
  selectedAudioDevice,
  onVideoDeviceChange,
  onAudioDeviceChange,
}: DeviceListProps) => {
  return (
    <div className="space-y-4">
      <DeviceSelector
        label="摄像头"
        devices={videoDevices}
        selectedDevice={selectedVideoDevice}
        onDeviceChange={onVideoDeviceChange}
      />
      
      <DeviceSelector
        label="麦克风"
        devices={audioDevices}
        selectedDevice={selectedAudioDevice}
        onDeviceChange={onAudioDeviceChange}
      />
    </div>
  );
};

export default DeviceList;