import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AcademicYearSelectProps {
  value: string;
  onChange: (value: string) => void;
  academicYears: string[];
}

export default function AcademicYearSelect({ value, onChange, academicYears }: AcademicYearSelectProps) {
  return (
    <div>
      <Label htmlFor="academic_year">Academic Year</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="academic_year" className="mt-1">
          <SelectValue placeholder="Select academic year" />
        </SelectTrigger>
        <SelectContent>
          {academicYears.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}