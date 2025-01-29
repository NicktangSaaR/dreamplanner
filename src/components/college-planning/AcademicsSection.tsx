import { Card } from "@/components/ui/card";
import { Course } from "./types/course";
import { useAcademicData } from "@/hooks/academics/useAcademicData";
import AcademicsHeader from "./academics/AcademicsHeader";
import CourseManagement from "./academics/CourseManagement";

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
  } = useAcademicData(externalCourses, onCoursesChange);

  console.log("AcademicsSection - Current courses:", courses);
  console.log("AcademicsSection - External courses:", externalCourses);
  console.log("AcademicsSection - Student ID:", studentId);

  if (!studentId) {
    console.log("No student ID available");
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
      />
    </Card>
  );
}