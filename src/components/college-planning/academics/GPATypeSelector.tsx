
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type GPACalculationType = "100-point" | "unweighted-us" | "uc-gpa";

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
        <SelectItem value="uc-gpa">UC GPA</SelectItem>
      </SelectContent>
    </Select>
  );
}
