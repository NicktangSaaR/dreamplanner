
import { Calculator } from "lucide-react";
import { Course } from "../../types/course";
import { GPACalculationType } from "../GPATypeSelector";
import { 
  calculateYearGPA, 
  getGPAScale,
  getGPATypeLabel
} from "../utils/gpaCalculations";

interface YearlyGPADisplayProps {
  courses: Course[];
  gpaType: GPACalculationType;
  academicYears: string[];
}

export default function YearlyGPADisplay({ 
  courses, 
  gpaType, 
  academicYears 
}: YearlyGPADisplayProps) {
  return (
    <div className="grid gap-2">
      {academicYears.map(year => (
        <div key={year} className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg">
            <div>
              <p className="text-xs font-medium text-green-600">{year} {getGPATypeLabel(gpaType)}</p>
              <p className="text-base font-bold text-green-700">
                {calculateYearGPA(courses, year, gpaType).toFixed(2)}
                {gpaType === "100-point" ? "" : `/${getGPAScale(gpaType)}`}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
