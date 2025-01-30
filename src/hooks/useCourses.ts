import { Course } from "@/components/college-planning/types/course";
import { useCoursesQuery } from "./queries/useCoursesQuery";
import { useCourseMutations } from "./mutations/useCourseMutations";

export const useCourses = (externalCourses?: Course[], studentId?: string) => {
  console.log("useCourses - Student ID:", studentId);
  
  const { 
    data: courses = [], 
    isLoading,
    refetch 
  } = useCoursesQuery(externalCourses, studentId);

  const { addCourse, updateCourse, deleteCourse } = useCourseMutations(refetch);

  // If external courses are provided, use those, otherwise use fetched courses
  const finalCourses = externalCourses ?? courses;
  console.log("useCourses - Final courses:", finalCourses);

  return {
    courses: finalCourses,
    isLoading,
    addCourse,
    updateCourse,
    deleteCourse,
  };
};