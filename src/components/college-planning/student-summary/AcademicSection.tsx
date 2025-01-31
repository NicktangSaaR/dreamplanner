import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import GradeCalculator from "../academics/GradeCalculator";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  studentId: string;
}

export default function AcademicSection({ courses, studentId }: AcademicSectionProps) {
  console.log("Academic Section - Courses:", courses);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <CardTitle>Academic Records</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* GPA Summary */}
        <GradeCalculator courses={courses} />

        {/* Course List */}
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {Object.entries(groupCoursesByYear(courses))
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function groupCoursesByYear(courses: Course[]) {
  return courses.reduce((acc: { [key: string]: Course[] }, course) => {
    const year = course.academic_year || 'Unspecified';
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(course);
    return acc;
  }, {});
}