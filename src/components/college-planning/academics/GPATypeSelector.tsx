
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type GPACalculationType = "100-point" | "unweighted-us" | "uc-weighted" | "uc-capped" | "college-gpa-4.0" | "college-gpa-4.33";

interface GPATypeSelectorProps {
  value: GPACalculationType;
  onChange: (value: GPACalculationType) => void;
}

export default function GPATypeSelector({ value, onChange }: GPATypeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-full">
        <SelectValue placeholder="Select GPA type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="100-point">100分制平均分</SelectItem>
        <SelectItem value="unweighted-us">Unweighted GPA-US</SelectItem>
        <SelectItem value="uc-weighted">Weighted UC GPA</SelectItem>
        <SelectItem value="uc-capped">Capped UC GPA (4.5)</SelectItem>
        <SelectItem value="college-gpa-4.0">US College GPA (4.0 Scale)</SelectItem>
        <SelectItem value="college-gpa-4.33">US College GPA (4.33 Scale)</SelectItem>
      </SelectContent>
    </Select>
  );
}
