import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimeSettingsProps {
  prepTime: number;
  responseTime: number;
  onPrepTimeChange: (time: number) => void;
  onResponseTimeChange: (time: number) => void;
}

const TimeSettings = ({
  prepTime,
  responseTime,
  onPrepTimeChange,
  onResponseTimeChange,
}: TimeSettingsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <Label>Preparation Time (seconds)</Label>
        <Input
          type="number"
          value={prepTime}
          onChange={(e) => onPrepTimeChange(parseInt(e.target.value))}
          min={30}
          max={300}
        />
      </div>
      <div>
        <Label>Response Time (seconds)</Label>
        <Input
          type="number"
          value={responseTime}
          onChange={(e) => onResponseTimeChange(parseInt(e.target.value))}
          min={60}
          max={600}
        />
      </div>
    </div>
  );
};

export default TimeSettings;