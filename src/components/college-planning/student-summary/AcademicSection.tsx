import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { calculateGPA } from "../academics/GradeCalculator";

interface Course {
  id: string;
  name: string;
  grade: string;
  course_type: string;
  semester: string;
  academic_year?: string;
  grade_type?: string;
}

interface AcademicSectionProps {
  courses: Course[];
}

export default function AcademicSection({ courses }: AcademicSectionProps) {
  const calculateCurrentGPA = () => {
    if (courses.length === 0) return "0.00";
    const validCourses = courses.filter(course => course.grade !== "In Progress");
    if (validCourses.length === 0) return "0.00";
    
    const totalGPA = validCourses.reduce((sum, course) => {
      return sum + calculateGPA(course.grade, course.course_type || 'Regular', course.grade_type);
    }, 0);
    
    return (totalGPA / validCourses.length).toFixed(2);
  };

  // Group courses by academic year
  const coursesByYear = courses.reduce((acc: { [key: string]: Course[] }, course) => {
    const year = course.academic_year || 'Unspecified';
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(course);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <CardTitle>Academic Records</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-300">Current GPA</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{calculateCurrentGPA()}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-300">Total Courses</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-200">{courses.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(coursesByYear)
            .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
            .map(([year, yearCourses]) => (
              <div key={year} className="space-y-2">
                <h3 className="font-semibold text-lg">{year}</h3>
                <div className="grid grid-cols-1 gap-2">
                  {yearCourses.map((course) => (
                    <div 
                      key={course.id} 
                      className="flex justify-between items-center bg-muted/50 p-3 rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{course.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {course.course_type} • {course.semester}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{course.grade}</p>
                        <p className="text-sm text-muted-foreground">
                          {calculateGPA(course.grade, course.course_type || 'Regular', course.grade_type).toFixed(2)} GPA
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}