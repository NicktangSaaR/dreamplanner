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

  return {
    courses: externalCourses || courses,
    isLoading,
    addCourse,
    updateCourse,
  };
};