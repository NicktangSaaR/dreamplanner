import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/components/college-planning/types/course";
import { calculateGPA } from "@/components/college-planning/academics/GradeCalculator";
import { toast } from "sonner";

export const useCourses = (externalCourses?: Course[]) => {
  const queryClient = useQueryClient();

  const { 
    data: fetchedCourses = [], 
    refetch 
  } = useQuery({
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
        return [];
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', user.id)
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
  });

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      await refetch();
      toast({
        title: "Success",
        description: "Course added successfully",
      });
    },
    onError: (error) => {
      console.error('Error in addCourseMutation:', error);
      toast({
        title: "Error",
        description: "Failed to add course",
        variant: "destructive",
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      refetch();
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error in updateCourseMutation:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    },
  });

  return {
    courses: externalCourses || fetchedCourses,
    addCourse: addCourseMutation.mutateAsync,
    updateCourse: updateCourseMutation.mutateAsync,
  };
};