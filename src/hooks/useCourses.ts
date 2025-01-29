import { Course } from "@/components/college-planning/types/course";
import { useCoursesQuery } from "./queries/useCoursesQuery";
import { useCourseMutations } from "./mutations/useCourseMutations";

export const useCourses = (externalCourses?: Course[]) => {
  const { 
    data: courses = [], 
    isLoading,
    refetch 
  } = useCoursesQuery(externalCourses);

  const { addCourse, updateCourse } = useCourseMutations(refetch);

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