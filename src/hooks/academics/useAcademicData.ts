import { useProfile } from "@/hooks/useProfile";
import { useParams } from "react-router-dom";
import { useCourses } from "../useCourses";
import { Course } from "@/components/college-planning/types/course";

export const useAcademicData = (
  externalCourses?: Course[],
  onCoursesChange?: (courses: Course[]) => void
) => {
  const { studentId } = useParams();
  const { profile } = useProfile();
  const effectiveStudentId = studentId || profile?.id;
  
  const {
    courses,
    isLoading,
    addCourse,
    updateCourse,
  } = useCourses(externalCourses);

  return {
    studentId: effectiveStudentId,
    courses,
    isLoading,
    addCourse,
    updateCourse,
    onCoursesChange,
  };
};