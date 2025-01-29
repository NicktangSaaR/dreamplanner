import { Course } from "@/components/college-planning/types/course";
import { useCoursesQuery } from "./queries/useCoursesQuery";
import { useCourseMutations } from "./mutations/useCourseMutations";
import { useParams } from "react-router-dom";

export const useCourses = (externalCourses?: Course[]) => {
  const { studentId } = useParams();
  console.log("useCourses - Using student ID:", studentId);

  const { 
    data: courses = [], 
    isLoading,
    refetch 
  } = useCoursesQuery(externalCourses);

  const { addCourse, updateCourse } = useCourseMutations(refetch, studentId);

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