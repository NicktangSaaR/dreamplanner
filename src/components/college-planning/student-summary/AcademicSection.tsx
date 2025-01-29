import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface Course {
  id: string;
  name: string;
  grade: string;
  gpa_value: number | null;
}

interface AcademicSectionProps {
  courses: Course[];
}

export default function AcademicSection({ courses }: AcademicSectionProps) {
  const calculateCurrentGPA = () => {
    if (courses.length === 0) return "0.00";
    const validCourses = courses.filter(course => course.gpa_value !== null);
    if (validCourses.length === 0) return "0.00";
    const totalGPA = validCourses.reduce((sum, course) => sum + (course.gpa_value || 0), 0);
    return (totalGPA / validCourses.length).toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <CardTitle>Academic Records</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Current GPA</p>
            <p className="text-2xl font-bold text-blue-700">{calculateCurrentGPA()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">Total Courses</p>
            <p className="text-2xl font-bold text-green-700">{courses.length}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Recent Courses:</p>
          <div className="space-y-2">
            {courses.slice(0, 3).map((course) => (
              <div key={course.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span>{course.name}</span>
                <span className="font-medium">{course.grade}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}