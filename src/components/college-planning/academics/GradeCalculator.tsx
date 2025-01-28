import { Calculator } from "lucide-react";

export const GRADE_TO_GPA: { [key: string]: number } = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

export const COURSE_TYPE_BONUS: { [key: string]: number } = {
  'Regular': 0,
  'Honors': 0.5,
  'AP/IB': 1.0
};

interface Course {
  grade: string;
  course_type: string;
  gpa_value?: number;
  academic_year?: string;
}

interface GradeCalculatorProps {
  courses: Course[];
}

export function calculateGPA(grade: string, courseType: string): number {
  const baseGPA = GRADE_TO_GPA[grade.toUpperCase()] || 0;
  const bonus = COURSE_TYPE_BONUS[courseType] || 0;
  return baseGPA + bonus;
}

function calculateUnweightedGPA(grade: string): number {
  return GRADE_TO_GPA[grade.toUpperCase()] || 0;
}

function calculateYearGPA(courses: Course[], academicYear: string, weighted: boolean = true): number {
  const yearCourses = courses.filter(course => course.academic_year === academicYear);
  if (yearCourses.length === 0) return 0;

  const totalGPA = yearCourses.reduce((sum, course) => {
    if (weighted) {
      return sum + (course.gpa_value || calculateGPA(course.grade, course.course_type));
    } else {
      return sum + calculateUnweightedGPA(course.grade);
    }
  }, 0);
  
  return Number((totalGPA / yearCourses.length).toFixed(2));
}

export default function GradeCalculator({ courses }: GradeCalculatorProps) {
  const calculateOverallGPA = (weighted: boolean = true): number => {
    if (courses.length === 0) return 0;
    const totalGPA = courses.reduce((sum, course) => {
      if (weighted) {
        return sum + (course.gpa_value || calculateGPA(course.grade, course.course_type));
      } else {
        return sum + calculateUnweightedGPA(course.grade);
      }
    }, 0);
    return Number((totalGPA / courses.length).toFixed(2));
  };

  // Get unique academic years from courses
  const academicYears = Array.from(new Set(courses.map(course => course.academic_year)))
    .filter(year => year)
    .sort()
    .reverse();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
          <Calculator className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-xs font-medium text-green-600">Weighted</p>
            <p className="text-xl font-bold text-green-700">{calculateOverallGPA(true)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
          <Calculator className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-xs font-medium text-blue-600">Unweighted</p>
            <p className="text-xl font-bold text-blue-700">{calculateOverallGPA(false)}</p>
          </div>
        </div>
      </div>
      
      {/* Academic Year GPAs */}
      <div className="grid gap-2">
        {academicYears.map(year => (
          <div key={year} className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg">
              <div>
                <p className="text-xs font-medium text-green-600">{year} Weighted</p>
                <p className="text-lg font-bold text-green-700">
                  {calculateYearGPA(courses, year, true)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
              <div>
                <p className="text-xs font-medium text-blue-600">{year} Unweighted</p>
                <p className="text-lg font-bold text-blue-700">
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