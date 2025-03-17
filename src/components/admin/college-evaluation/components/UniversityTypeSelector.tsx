
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UniversityType } from "../types";

interface UniversityTypeSelectorProps {
  value: UniversityType;
  onChange: (value: UniversityType) => void;
}

export default function UniversityTypeSelector({ value, onChange }: UniversityTypeSelectorProps) {
  // Helper function to get university type display name
  const getUniversityTypeLabel = (type: UniversityType): string => {
    switch (type) {
      case 'ivyLeague':
        return "Ivy League University";
      case 'top30':
        return "Top 20-30 University";
      case 'ucSystem':
        return "UC System University";
      default:
        return "US University";
    }
  };

  return (
    <div className="mb-6">
      <Label htmlFor="university-type">Select University Type</Label>
      <Select
        value={value}
        onValueChange={(value: UniversityType) => onChange(value)}
      >
        <SelectTrigger id="university-type" className="w-full">
          <SelectValue placeholder="Select University Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ivyLeague">Ivy League University</SelectItem>
          <SelectItem value="top30">Top 20-30 University</SelectItem>
          <SelectItem value="ucSystem">UC System University</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
