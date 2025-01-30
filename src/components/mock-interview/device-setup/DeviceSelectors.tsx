import { MediaDevice } from "@/types/device";
import DeviceList from "./DeviceList";
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
    <div className="space-y-6">
      <DeviceList
        videoDevices={videoDevices}
        audioDevices={audioDevices}
        selectedVideoDevice={selectedVideoDevice}
        selectedAudioDevice={selectedAudioDevice}
        onVideoDeviceChange={onVideoDeviceChange}
        onAudioDeviceChange={onAudioDeviceChange}
        isCameraWorking={isCameraWorking}
        isAudioWorking={isAudioWorking}
      />
      
      <div className="space-y-2">
        <DeviceStatus label="摄像头" isWorking={isCameraWorking} />
        <DeviceStatus label="麦克风" isWorking={isAudioWorking} />
      </div>
    </div>
  );
};

export default DeviceSelectors;