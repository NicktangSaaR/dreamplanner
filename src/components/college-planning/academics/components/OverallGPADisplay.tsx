
import { Calculator } from "lucide-react";
import { Course } from "../../types/course";
import { GPACalculationType } from "../GPATypeSelector";
import { 
  calculateOverallGPA, 
  getGPAScale,
  getGPATypeLabel
} from "../utils/gpaCalculations";

interface OverallGPADisplayProps {
  courses: Course[];
  gpaType: GPACalculationType;
}

export default function OverallGPADisplay({ courses, gpaType }: OverallGPADisplayProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
        <Calculator className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-xs font-medium text-green-600">{getGPATypeLabel(gpaType)}</p>
          <p className="text-lg font-bold text-green-700">
            {calculateOverallGPA(courses, gpaType).toFixed(2)}
            {gpaType === "100-point" ? "" : `/${getGPAScale(gpaType)}`}
          </p>
        </div>
      </div>
    </div>
  );
}
