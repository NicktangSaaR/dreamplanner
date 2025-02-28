import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/components/college-planning/types/course";
import { toast } from "sonner";

export const useCourseMutations = (refetch: () => void) => {
  const addCourse = useMutation({
    mutationFn: async (newCourse: Omit<Course, 'id'>) => {
      console.log('Adding new course:', newCourse);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!newCourse.student_id) {
        throw new Error('No student ID provided');
      }

      const { data, error } = await supabase
        .from('courses')
        .insert([newCourse])
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
    onError: (error: Error) => {
      console.error('Error in addCourse mutation:', error);
      toast.error(error.message || 'Failed to add course');
    },
  });

  const updateCourse = useMutation({
    mutationFn: async (course: Course) => {
      console.log('Updating course:', course);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

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
    onError: (error: Error) => {
      console.error('Error in updateCourse mutation:', error);
      toast.error(error.message || 'Failed to update course');
    },
  });

  const deleteCourse = async (courseId: string) => {
    console.log('Deleting course:', courseId);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Error deleting course:', error);
      throw error;
    }

    console.log('Successfully deleted course:', courseId);
    refetch();
  };

  return {
    addCourse,
    updateCourse,
    deleteCourse,
  };
};