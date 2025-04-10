
import { Calculator } from "lucide-react";
import { useState } from "react";
import GPATypeSelector, { GPACalculationType } from "./GPATypeSelector";

export const GRADE_TO_GPA: { [key: string]: number } = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0
};

export const COURSE_TYPE_BONUS: { [key: string]: number } = {
  'Regular': 0,
  'Honors': 0.5,
  'AP/IB': 1.0
};

// UC GPA specific bonus
export const UC_COURSE_TYPE_BONUS: { [key: string]: number } = {
  'Regular': 0,
  'Honors': 1.0,
  'AP/IB': 1.0
};

export const SPECIAL_GRADES = ['In Progress', 'Pass/Fail', 'Drop'];

function getGPAFromPercentage(percentage: number, courseType: string = 'Regular'): number {
  let baseGPA = 0;
  
  if (percentage >= 97) baseGPA = 4.0;      // A+
  else if (percentage >= 93) baseGPA = 4.0;  // A
  else if (percentage >= 90) baseGPA = 3.7;  // A-
  else if (percentage >= 87) baseGPA = 3.3;  // B+
  else if (percentage >= 83) baseGPA = 3.0;  // B
  else if (percentage >= 80) baseGPA = 2.7;  // B-
  else if (percentage >= 77) baseGPA = 2.3;  // C+
  else if (percentage >= 73) baseGPA = 2.0;  // C
  else if (percentage >= 70) baseGPA = 1.7;  // C-
  else if (percentage >= 67) baseGPA = 1.3;  // D+
  else if (percentage >= 63) baseGPA = 1.0;  // D
  else if (percentage >= 60) baseGPA = 0.7;  // D-
  else baseGPA = 0.0;                        // F

  const bonus = COURSE_TYPE_BONUS[courseType] || 0;
  return baseGPA + bonus;
}

interface Course {
  grade: string;
  course_type: string;
  gpa_value?: number;
  academic_year?: string;
  grade_type?: string;
  grade_level?: string;
}

interface GradeCalculatorProps {
  courses: Course[];
}

export function calculateGPA(grade: string, courseType: string, gradeType: string = 'letter'): number {
  if (SPECIAL_GRADES.includes(grade)) return 0;
  
  if (gradeType === '100-point') {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
    return getGPAFromPercentage(numericGrade, courseType);
  }
  
  const baseGPA = GRADE_TO_GPA[grade.toUpperCase()] || 0;
  const bonus = COURSE_TYPE_BONUS[courseType] || 0;
  return baseGPA + bonus;
}

function calculateUnweightedGPA(grade: string, gradeType: string = 'letter'): number {
  if (SPECIAL_GRADES.includes(grade)) return 0;
  
  if (gradeType === '100-point') {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
    return getGPAFromPercentage(numericGrade, 'Regular');
  }
  return GRADE_TO_GPA[grade.toUpperCase()] || 0;
}

function calculateUCGPA(course: Course): number {
  if (SPECIAL_GRADES.includes(course.grade)) return 0;
  
  // UC GPA only counts courses from grades 10-12
  if (course.grade_level === '9') return 0;
  
  // Calculate base GPA (unweighted)
  let baseGPA = 0;
  if (course.grade_type === '100-point') {
    const numericGrade = parseFloat(course.grade);
    if (isNaN(numericGrade)) return 0;
    baseGPA = getGPAFromPercentage(numericGrade, 'Regular');
  } else {
    baseGPA = GRADE_TO_GPA[course.grade.toUpperCase()] || 0;
  }
  
  // Apply UC-specific course type bonus
  const bonus = UC_COURSE_TYPE_BONUS[course.course_type] || 0;
  return baseGPA + bonus;
}

function calculateYearGPA(courses: Course[], academicYear: string, gpaType: GPACalculationType): number {
  const yearCourses = courses.filter(course => 
    course.academic_year === academicYear && !SPECIAL_GRADES.includes(course.grade)
  );
  
  if (yearCourses.length === 0) return 0;

  let totalGPA = 0;
  let validCourseCount = 0;

  yearCourses.forEach(course => {
    let courseGPA = 0;
    
    if (gpaType === "unweighted-us") {
      courseGPA = calculateUnweightedGPA(course.grade, course.grade_type);
    } else if (gpaType === "uc-gpa") {
      courseGPA = calculateUCGPA(course);
      // Only count the course if it returned a non-zero GPA (e.g., not 9th grade)
      if (courseGPA > 0) {
        validCourseCount++;
      } else {
        return; // Skip this course for calculation
      }
    } else {
      courseGPA = course.gpa_value || calculateGPA(course.grade, course.course_type, course.grade_type);
    }
    
    totalGPA += courseGPA;
  });
  
  // For UC GPA, we might have filtered out some courses
  const coursesCount = gpaType === "uc-gpa" ? validCourseCount : yearCourses.length;
  
  return coursesCount > 0 ? Number((totalGPA / coursesCount).toFixed(2)) : 0;
}

function calculate100PointAverage(courses: Course[]): number | null {
  // Filter out special grade courses and check if remaining courses use 100-point scale
  const validCourses = courses.filter(course => !SPECIAL_GRADES.includes(course.grade));
  const all100Point = validCourses.every(course => course.grade_type === '100-point');
  
  if (!all100Point || validCourses.length === 0) return null;

  const totalPoints = validCourses.reduce((sum, course) => {
    const points = parseFloat(course.grade);
    return isNaN(points) ? sum : sum + points;
  }, 0);

  return Number((totalPoints / validCourses.length).toFixed(2));
}

function calculateYear100PointAverage(courses: Course[], academicYear: string): number | null {
  const yearCourses = courses.filter(course => 
    course.academic_year === academicYear && !SPECIAL_GRADES.includes(course.grade)
  );
  return calculate100PointAverage(yearCourses);
}

export default function GradeCalculator({ courses }: GradeCalculatorProps) {
  const [gpaType, setGpaType] = useState<GPACalculationType>("unweighted-us");

  const calculateOverallGPA = (): number => {
    const validCourses = courses.filter(course => !SPECIAL_GRADES.includes(course.grade));
    if (validCourses.length === 0) return 0;
    
    if (gpaType === "100-point") {
      const average = calculate100PointAverage(validCourses);
      return average !== null ? average : 0;
    }

    let totalGPA = 0;
    let validCourseCount = 0;

    validCourses.forEach(course => {
      let courseGPA = 0;
      
      if (gpaType === "unweighted-us") {
        courseGPA = calculateUnweightedGPA(course.grade, course.grade_type);
      } else if (gpaType === "uc-gpa") {
        courseGPA = calculateUCGPA(course);
        // Only count the course if it returned a non-zero GPA (e.g., not 9th grade)
        if (courseGPA > 0) {
          validCourseCount++;
        } else {
          return; // Skip this course
        }
      } else {
        courseGPA = course.gpa_value || calculateGPA(course.grade, course.course_type, course.grade_type);
      }
      
      totalGPA += courseGPA;
    });
    
    // For UC GPA, we might have filtered out some courses
    const coursesCount = gpaType === "uc-gpa" ? validCourseCount : validCourses.length;
    
    return coursesCount > 0 ? Number((totalGPA / coursesCount).toFixed(2)) : 0;
  };

  const getGPAScale = () => {
    return gpaType === "100-point" ? "100" : "4.0";
  };

  const getGPATypeLabel = () => {
    switch (gpaType) {
      case "100-point": return "100分制平均分";
      case "unweighted-us": return "Unweighted GPA-US";
      case "uc-gpa": return "UC GPA";
      default: return "GPA";
    }
  };

  const academicYears = Array.from(new Set(courses.map(course => course.academic_year)))
    .filter(year => year)
    .sort()
    .reverse();

  const average100Point = calculate100PointAverage(courses);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">GPA Calculator</h3>
        <div className="w-48">
          <GPATypeSelector value={gpaType} onChange={setGpaType} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
          <Calculator className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-xs font-medium text-green-600">{getGPATypeLabel()}</p>
            <p className="text-lg font-bold text-green-700">
              {calculateOverallGPA().toFixed(2)}{gpaType === "100-point" ? "" : `/${getGPAScale()}`}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-2">
        {academicYears.map(year => (
          <div key={year} className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg">
              <div>
                <p className="text-xs font-medium text-green-600">{year} {getGPATypeLabel()}</p>
                <p className="text-base font-bold text-green-700">
                  {calculateYearGPA(courses, year, gpaType).toFixed(2)}
                  {gpaType === "100-point" ? "" : `/${getGPAScale()}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
