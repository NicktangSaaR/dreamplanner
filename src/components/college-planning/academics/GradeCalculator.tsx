import { Calculator } from "lucide-react";

const GRADE_TO_GPA: { [key: string]: number } = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

const COURSE_TYPE_BONUS: { [key: string]: number } = {
  'Regular': 0,
  'Honors': 0.5,
  'AP/IB': 1.0
};

interface Course {
  grade: string;
  course_type: string;
  gpa_value?: number;
}

interface GradeCalculatorProps {
  courses: Course[];
}

export function calculateGPA(grade: string, courseType: string): number {
  const baseGPA = GRADE_TO_GPA[grade.toUpperCase()] || 0;
  const bonus = COURSE_TYPE_BONUS[courseType] || 0;
  return baseGPA + bonus;
}

export default function GradeCalculator({ courses }: GradeCalculatorProps) {
  const calculateOverallGPA = (): number => {
    if (courses.length === 0) return 0;
    const totalGPA = courses.reduce((sum, course) => {
      return sum + (course.gpa_value || calculateGPA(course.grade, course.course_type));
    }, 0);
    return Number((totalGPA / courses.length).toFixed(2));
  };

  return (
    <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
      <Calculator className="h-5 w-5 text-green-600" />
      <div>
        <p className="text-sm font-medium text-green-600">Overall GPA</p>
        <p className="text-2xl font-bold text-green-700">{calculateOverallGPA()}</p>
      </div>
    </div>
  );
}