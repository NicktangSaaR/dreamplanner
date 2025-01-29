import { Course } from "@/components/college-planning/types/course";
import { useCoursesQuery } from "./queries/useCoursesQuery";
import { useCourseMutations } from "./mutations/useCourseMutations";
import { useParams } from "react-router-dom";
import { useProfile } from "./useProfile";

export const useCourses = (externalCourses?: Course[]) => {
  const { studentId } = useParams();
  const { profile } = useProfile();
  const effectiveStudentId = studentId || profile?.id;
  
  console.log("useCourses - Using student ID:", effectiveStudentId);

  const { 
    data: courses = [], 
    isLoading,
    refetch 
  } = useCoursesQuery(externalCourses);

  const { addCourse, updateCourse } = useCourseMutations(refetch, effectiveStudentId);

  // If external courses are provided, use those, otherwise use fetched courses
  const finalCourses = externalCourses ?? courses;
  console.log("useCourses - Final courses:", finalCourses);

  return {
    courses: finalCourses,
    isLoading,
    addCourse,
    updateCourse,
  };
};