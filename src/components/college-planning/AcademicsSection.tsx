import { Card } from "@/components/ui/card";
import { Course } from "./types/course";
import { useAcademicData } from "@/hooks/academics/useAcademicData";
import AcademicsHeader from "./academics/AcademicsHeader";
import CourseManagement from "./academics/CourseManagement";
import { useCallback } from "react";

interface AcademicsSectionProps {
  courses?: Course[];
  onCoursesChange?: (courses: Course[]) => void;
}

export default function AcademicsSection({ 
  courses: externalCourses, 
  onCoursesChange 
}: AcademicsSectionProps) {
  const {
    studentId,
    courses,
    isLoading,
    addCourse,
    updateCourse,
    deleteCourse,
  } = useAcademicData(externalCourses, onCoursesChange);

  const handleCoursesChange = useCallback((newCourses: Course[]) => {
    if (onCoursesChange) {
      onCoursesChange(newCourses);
    }
  }, [onCoursesChange]);

  if (!studentId) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full">
      <AcademicsHeader courses={courses || []} />
      <CourseManagement
        courses={courses || []}
        isLoading={isLoading}
        studentId={studentId}
        addCourse={addCourse}
        updateCourse={updateCourse}
        deleteCourse={deleteCourse}
        onCoursesChange={handleCoursesChange}
      />
    </Card>
  );
}