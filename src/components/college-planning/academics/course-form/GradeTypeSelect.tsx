import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GradeTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function GradeTypeSelect({ value, onChange }: GradeTypeSelectProps) {
  return (
    <div>
      <Label htmlFor="grade_type">Grade Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="grade_type" className="mt-1">
          <SelectValue placeholder="Select grade type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="letter">Letter Grade</SelectItem>
          <SelectItem value="100-point">100-Point Scale</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}