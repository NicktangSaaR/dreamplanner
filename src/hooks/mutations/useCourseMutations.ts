import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/components/college-planning/types/course";
import { toast } from "sonner";

export const useCourseMutations = (refetch: () => void) => {
  const addCourse = useMutation({
    mutationFn: async (newCourse: Omit<Course, 'id'>) => {
      console.log('Adding new course:', newCourse);
      
      // Get the current URL path
      const path = window.location.pathname;
      // Extract student ID from the URL if it exists
      const studentIdMatch = path.match(/student-dashboard\/([^/]+)/);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const studentId = studentIdMatch ? studentIdMatch[1] : user?.id;
      if (!studentId) throw new Error('No student ID found');

      const { data, error } = await supabase
        .from('courses')
        .insert([{ ...newCourse, student_id: studentId }])
        .select()
        .single();

      if (error) {
        console.error('Error adding course:', error);
        throw error;
      }

      console.log('Successfully added course:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Course added successfully');
      refetch();
    },
    onError: (error) => {
      console.error('Error in addCourse mutation:', error);
      toast.error('Failed to add course');
    },
  });

  const updateCourse = useMutation({
    mutationFn: async (course: Course) => {
      console.log('Updating course:', course);
      const { data, error } = await supabase
        .from('courses')
        .update(course)
        .eq('id', course.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating course:', error);
        throw error;
      }

      console.log('Successfully updated course:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Course updated successfully');
      refetch();
    },
    onError: (error) => {
      console.error('Error in updateCourse mutation:', error);
      toast.error('Failed to update course');
    },
  });

  return {
    addCourse,
    updateCourse,
  };
};