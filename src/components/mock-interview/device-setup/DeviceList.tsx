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
  isCameraWorking,
  isAudioWorking,
}: DeviceListProps) => {
  return (
    <div className="space-y-6">
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
      
      <div className="space-y-2">
        <DeviceStatus label="摄像头" isWorking={isCameraWorking} />
        <DeviceStatus label="麦克风" isWorking={isAudioWorking} />
      </div>
    </div>
  );
};

export default DeviceList;