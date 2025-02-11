
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GradeInputProps {
  gradeType: string;
  value: string;
  onChange: (value: string) => void;
}

export default function GradeInput({ gradeType, value, onChange }: GradeInputProps) {
  if (gradeType === '100-point') {
    return (
      <div>
        <Label htmlFor="grade">Grade</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="grade" className="mt-1">
            <SelectValue placeholder="Enter grade or select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pass/Fail">Pass/Fail</SelectItem>
            <SelectItem value="Planned">Planned</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Drop">Drop</SelectItem>
            {Array.from({ length: 101 }, (_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="grade">Grade</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="grade" className="mt-1">
          <SelectValue placeholder="Select grade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="A+">A+</SelectItem>
          <SelectItem value="A">A</SelectItem>
          <SelectItem value="A-">A-</SelectItem>
          <SelectItem value="B+">B+</SelectItem>
          <SelectItem value="B">B</SelectItem>
          <SelectItem value="B-">B-</SelectItem>
          <SelectItem value="C+">C+</SelectItem>
          <SelectItem value="C">C</SelectItem>
          <SelectItem value="C-">C-</SelectItem>
          <SelectItem value="D+">D+</SelectItem>
          <SelectItem value="D">D</SelectItem>
          <SelectItem value="D-">D-</SelectItem>
          <SelectItem value="F">F</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Pass/Fail">Pass/Fail</SelectItem>
          <SelectItem value="Drop">Drop</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
