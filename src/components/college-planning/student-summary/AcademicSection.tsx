
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import GradeCalculator from "../academics/GradeCalculator";
import CourseManagement from "../academics/CourseManagement";
import { Course } from "../types/course";
import { useCoursesQuery } from "@/hooks/queries/useCoursesQuery";
import { useCourseMutations } from "@/hooks/mutations/useCourseMutations";
import { useProfile } from "@/hooks/useProfile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AcademicSectionProps {
  courses: Course[];
  studentId: string;
}

export default function AcademicSection({ courses: initialCourses, studentId }: AcademicSectionProps) {
  const { profile } = useProfile();
  const isCounselor = profile?.user_type === 'counselor' || profile?.user_type === 'admin';

  const { data: courses = initialCourses, refetch, isLoading } = useCoursesQuery(undefined, studentId);
  const { addCourse, updateCourse, deleteCourse } = useCourseMutations(refetch);

  const validCourses = courses.map(course => ({
    ...course,
    student_id: course.student_id || studentId
  }));

  if (isCounselor) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>Academic Records</CardTitle>
          </div>
        </CardHeader>
        {/* GPA Summary */}
        <div className="px-6 pb-2">
          <GradeCalculator courses={validCourses} />
        </div>
        {/* Full course management for counselors */}
        <CourseManagement
          courses={validCourses}
          isLoading={isLoading}
          studentId={studentId}
          addCourse={addCourse}
          updateCourse={updateCourse}
          deleteCourse={deleteCourse}
        />
      </Card>
    );
  }

  // Read-only view for students
  const groupCoursesByYear = (courses: Course[]) => {
    return courses.reduce((acc: { [key: string]: Course[] }, course) => {
      const year = course.academic_year || 'Unspecified';
      if (!acc[year]) acc[year] = [];
      acc[year].push(course);
      return acc;
    }, {});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <CardTitle>Academic Records</CardTitle>
        </div>
      </CardHeader>
      <div className="px-6 pb-2">
        <GradeCalculator courses={validCourses} />
      </div>
      <div className="px-6 pb-6">
        <ScrollArea className="h-[600px]">
          <Accordion type="multiple" className="space-y-4">
            {Object.entries(groupCoursesByYear(validCourses))
              .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
              .map(([year, yearCourses]) => (
                <AccordionItem key={year} value={year} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <h3 className="font-semibold text-lg">{year}</h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-2 pt-2">
                      {yearCourses.map((course) => (
                        <div key={course.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
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
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </ScrollArea>
      </div>
    </Card>
  );
}
