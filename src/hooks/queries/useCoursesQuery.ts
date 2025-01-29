import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/components/college-planning/types/course";
import { useParams } from "react-router-dom";

export const useCoursesQuery = (externalCourses?: Course[]) => {
  const { studentId } = useParams();
  
  return useQuery({
    queryKey: ['courses', studentId],
    queryFn: async () => {
      if (externalCourses) {
        console.log('Using external courses:', externalCourses);
        return externalCourses;
      }

      if (!studentId) {
        console.error('No student ID provided');
        return [];
      }

      console.log('Fetching courses for student ID:', studentId);

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