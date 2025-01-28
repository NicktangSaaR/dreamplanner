import { Calculator } from "lucide-react";

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

  // Apply course type bonus
  const bonus = COURSE_TYPE_BONUS[courseType] || 0;
  return baseGPA + bonus;
}

interface Course {
  grade: string;
  course_type: string;
  gpa_value?: number;
  academic_year?: string;
  grade_type?: string;
}

interface GradeCalculatorProps {
  courses: Course[];
}

export function calculateGPA(grade: string, courseType: string, gradeType: string = 'letter'): number {
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
  if (gradeType === '100-point') {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade)) return 0;
    return getGPAFromPercentage(numericGrade, 'Regular');
  }
  return GRADE_TO_GPA[grade.toUpperCase()] || 0;
}

function calculateYearGPA(courses: Course[], academicYear: string, weighted: boolean = true): number {
  const yearCourses = courses.filter(course => course.academic_year === academicYear);
  if (yearCourses.length === 0) return 0;

  const totalGPA = yearCourses.reduce((sum, course) => {
    if (weighted) {
      return sum + (course.gpa_value || calculateGPA(course.grade, course.course_type, course.grade_type));
    } else {
      return sum + calculateUnweightedGPA(course.grade, course.grade_type);
    }
  }, 0);
  
  return Number((totalGPA / yearCourses.length).toFixed(2));
}

function calculate100PointAverage(courses: Course[]): number | null {
  // Only calculate if all courses use 100-point scale
  const all100Point = courses.every(course => course.grade_type === '100-point');
  if (!all100Point || courses.length === 0) return null;

  const totalPoints = courses.reduce((sum, course) => {
    const points = parseFloat(course.grade);
    return isNaN(points) ? sum : sum + points;
  }, 0);

  return Number((totalPoints / courses.length).toFixed(2));
}

export default function GradeCalculator({ courses }: GradeCalculatorProps) {
  const calculateOverallGPA = (weighted: boolean = true): number => {
    if (courses.length === 0) return 0;
    const totalGPA = courses.reduce((sum, course) => {
      if (weighted) {
        return sum + (course.gpa_value || calculateGPA(course.grade, course.course_type, course.grade_type));
      } else {
        return sum + calculateUnweightedGPA(course.grade, course.grade_type);
      }
    }, 0);
    return Number((totalGPA / courses.length).toFixed(2));
  };

  // Get unique academic years from courses
  const academicYears = Array.from(new Set(courses.map(course => course.academic_year)))
    .filter(year => year)
    .sort()
    .reverse();

  const average100Point = calculate100PointAverage(courses);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
          <Calculator className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-xs font-medium text-green-600">Weighted</p>
            <p className="text-lg font-bold text-green-700">{calculateOverallGPA(true)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
          <Calculator className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-xs font-medium text-blue-600">Unweighted</p>
            <p className="text-lg font-bold text-blue-700">{calculateOverallGPA(false)}</p>
          </div>
        </div>
      </div>
      
      {average100Point !== null && (
        <div className="flex items-center gap-2 bg-purple-50 p-3 rounded-lg">
          <Calculator className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-xs font-medium text-purple-600">100-Point Average</p>
            <p className="text-lg font-bold text-purple-700">{average100Point}</p>
          </div>
        </div>
      )}
      
      <div className="grid gap-2">
        {academicYears.map(year => (
          <div key={year} className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg">
              <div>
                <p className="text-xs font-medium text-green-600">{year} Weighted</p>
                <p className="text-base font-bold text-green-700">
                  {calculateYearGPA(courses, year, true)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
              <div>
                <p className="text-xs font-medium text-blue-600">{year} Unweighted</p>
                <p className="text-base font-bold text-blue-700">
                  {calculateYearGPA(courses, year, false)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
