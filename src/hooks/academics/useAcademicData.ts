import { useProfile } from "@/hooks/useProfile";
import { useParams } from "react-router-dom";
import { useCourses } from "../useCourses";
import { Course } from "@/components/college-planning/types/course";

export const useAcademicData = (
  externalCourses?: Course[],
  onCoursesChange?: (courses: Course[]) => void
) => {
  const { studentId } = useParams<{ studentId: string }>();
  const { profile } = useProfile();
  
  // If no studentId in URL params, use the profile id
  const effectiveStudentId = studentId || profile?.id;

  console.log("useAcademicData - Effective student ID:", effectiveStudentId);
  
  const {
    courses,
    isLoading,
    addCourse,
    updateCourse,
  } = useCourses(externalCourses, effectiveStudentId);

  // Don't return until we have a valid student ID
  if (!effectiveStudentId) {
    console.log("useAcademicData - No effective student ID available");
    return {
      studentId: null,
      courses: [],
      isLoading: true,
      addCourse,
      updateCourse,
      onCoursesChange,
    };
  }

  return {
    studentId: effectiveStudentId,
    courses,
    isLoading,
    addCourse,
    updateCourse,
    onCoursesChange,
  };
};