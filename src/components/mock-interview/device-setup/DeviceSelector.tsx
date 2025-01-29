import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface DeviceSelectorProps {
  label: string;
  devices: MediaDevice[];
  selectedDevice: string;
  onDeviceChange: (deviceId: string) => void;
}

const DeviceSelector = ({ label, devices, selectedDevice, onDeviceChange }: DeviceSelectorProps) => {
  return (
    <div className="flex items-center justify-between">
      <span>{label}：</span>
      <Select value={selectedDevice} onValueChange={onDeviceChange}>
        <SelectTrigger className="w-[260px]">
          <SelectValue placeholder={`选择${label}`} />
        </SelectTrigger>
        <SelectContent>
          {devices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DeviceSelector;