
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
        return "常青藤大学";
      case 'top30':
        return "Top 20-30 大学";
      case 'ucSystem':
        return "UC系统大学";
      default:
        return "美国大学";
    }
  };

  return (
    <div className="mb-6">
      <Label htmlFor="university-type">选择大学类型</Label>
      <Select
        value={value}
        onValueChange={(value: UniversityType) => onChange(value)}
      >
        <SelectTrigger id="university-type" className="w-full">
          <SelectValue placeholder="选择大学类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ivyLeague">常青藤大学</SelectItem>
          <SelectItem value="top30">Top 20-30 大学</SelectItem>
          <SelectItem value="ucSystem">UC系统大学</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
