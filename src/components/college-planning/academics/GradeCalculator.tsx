
import { useState } from "react";
import GPATypeSelector, { GPACalculationType } from "./GPATypeSelector";
import OverallGPADisplay from "./components/OverallGPADisplay";
import YearlyGPADisplay from "./components/YearlyGPADisplay";
import { Course } from "../types/course";

// Re-export calculateGPA for other components that might depend on it
export { calculateGPA } from "./utils/gpaCalculations";

interface GradeCalculatorProps {
  courses: Course[];
}

export default function GradeCalculator({ courses }: GradeCalculatorProps) {
  const [gpaType, setGpaType] = useState<GPACalculationType>("unweighted-us");

  // Extract unique academic years
  const academicYears = Array.from(new Set(courses.map(course => course.academic_year)))
    .filter(year => year)
    .sort()
    .reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">GPA Calculator</h3>
        <div className="w-48">
          <GPATypeSelector value={gpaType} onChange={setGpaType} />
        </div>
      </div>

      {/* Overall GPA Display */}
      <OverallGPADisplay 
        courses={courses} 
        gpaType={gpaType} 
      />
      
      {/* Yearly GPA Display */}
      <YearlyGPADisplay 
        courses={courses} 
        gpaType={gpaType} 
        academicYears={academicYears} 
      />
    </div>
  );
}
