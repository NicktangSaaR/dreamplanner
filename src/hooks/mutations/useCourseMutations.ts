import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/components/college-planning/types/course";
import { calculateGPA } from "@/components/college-planning/academics/GradeCalculator";
import { toast } from "sonner";

export const useCourseMutations = (refetch: () => Promise<any>) => {
  const queryClient = useQueryClient();

  const addCourseMutation = useMutation({
    mutationFn: async (courseData: Omit<Course, 'id'>) => {
      console.log('Adding new course:', courseData);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No authenticated user found');
      }

      const gpaValue = calculateGPA(courseData.grade, courseData.course_type, courseData.grade_type);
      const { data, error } = await supabase
        .from('courses')
        .insert([{ 
          ...courseData, 
          student_id: user.id,
          gpa_value: gpaValue
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding course:', error);
        throw error;
      }

      console.log('Successfully added course:', data);
      return data;
    },
    onSuccess: async (newCourse) => {
      const currentCourses = queryClient.getQueryData<Course[]>(['courses']) || [];
      queryClient.setQueryData(['courses'], [newCourse, ...currentCourses]);
      
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      await refetch();
      toast.success("Course added successfully");
    },
    onError: (error) => {
      console.error('Error in addCourseMutation:', error);
      toast.error("Failed to add course");
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (course: Course) => {
      console.log('Updating course:', course);
      const gpaValue = calculateGPA(course.grade, course.course_type, course.grade_type);
      const { data, error } = await supabase
        .from('courses')
        .update({ ...course, gpa_value: gpaValue })
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
    onSuccess: async (updatedCourse) => {
      const currentCourses = queryClient.getQueryData<Course[]>(['courses']) || [];
      const updatedCourses = currentCourses.map(course => 
        course.id === updatedCourse.id ? updatedCourse : course
      );
      queryClient.setQueryData(['courses'], updatedCourses);
      
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      await refetch();
      toast.success("Course updated successfully");
    },
    onError: (error) => {
      console.error('Error in updateCourseMutation:', error);
      toast.error("Failed to update course");
    },
  });

  return {
    addCourse: addCourseMutation.mutateAsync,
    updateCourse: updateCourseMutation.mutateAsync,
  };
};