import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CourseTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CourseTypeSelect({ value, onChange }: CourseTypeSelectProps) {
  return (
    <div>
      <Label htmlFor="course_type">Course Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="course_type" className="mt-1">
          <SelectValue placeholder="Select course type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Regular">Regular</SelectItem>
          <SelectItem value="Honors">Honors</SelectItem>
          <SelectItem value="AP/IB">AP/IB</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}