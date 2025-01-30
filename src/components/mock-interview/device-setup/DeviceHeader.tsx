import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface DeviceHeaderProps {
  onBack: () => void;
}

const DeviceHeader = ({ onBack }: DeviceHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold">设备设置</h2>
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="w-10 h-10"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default DeviceHeader;