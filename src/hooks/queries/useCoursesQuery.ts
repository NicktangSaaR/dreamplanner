import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/components/college-planning/types/course";

export const useCoursesQuery = (externalCourses?: Course[]) => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      if (externalCourses) {
        console.log('Using external courses:', externalCourses);
        return externalCourses;
      }

      console.log('Fetching courses from database');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }

      console.log('Fetched courses:', data);
      return data as Course[];
    },
    enabled: true,
  });
};