
import { useQuery } from "@tanstack/react-query";
import { 
  fetchStudentProfile, 
  fetchStudentCourses, 
  fetchStudentActivities, 
  fetchStudentNotes 
} from "./queries/studentQueries";

export const useStudentData = (studentId: string | undefined) => {
  // Profile query
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: () => fetchStudentProfile(studentId!),
    enabled: Boolean(studentId),
  });

  // Courses query
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: () => fetchStudentCourses(studentId!),
    enabled: Boolean(studentId),
  });

  // Activities query
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["student-activities", studentId],
    queryFn: () => fetchStudentActivities(studentId!),
    enabled: Boolean(studentId),
  });

  // Notes query
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["student-notes", studentId],
    queryFn: () => fetchStudentNotes(studentId!),
    enabled: Boolean(studentId),
  });

  const isLoading = isLoadingProfile || isLoadingCourses || isLoadingActivities || isLoadingNotes;

  return {
    profile,
    courses,
    activities,
    notes,
    isLoading,
  };
};
