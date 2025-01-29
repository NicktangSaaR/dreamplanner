import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/components/college-planning/types/course";

export const useCoursesQuery = (externalCourses?: Course[], studentId?: string) => {
  return useQuery({
    queryKey: ['courses', studentId],
    queryFn: async () => {
      // If external courses are provided, return those
      if (externalCourses) {
        console.log('Using external courses:', externalCourses);
        return externalCourses;
      }

      // If no studentId is provided, return empty array
      if (!studentId) {
        console.log('No student ID provided for fetching courses');
        return [];
      }

      console.log('Fetching courses for student:', studentId);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }

      console.log('Fetched courses:', data);
      return data as Course[];
    },
    enabled: !!studentId || !!externalCourses,
  });
};