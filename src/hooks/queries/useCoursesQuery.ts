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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user found');
      }

      // Get the current URL path
      const path = window.location.pathname;
      // Extract student ID from the URL if it exists
      const studentIdMatch = path.match(/student-dashboard\/([^/]+)/);
      const studentId = studentIdMatch ? studentIdMatch[1] : user.id;

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
    enabled: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });
};