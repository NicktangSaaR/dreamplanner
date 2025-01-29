import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import GradeCalculator, { calculateGPA } from "./academics/GradeCalculator";
import CourseForm from "./academics/CourseForm";
import CourseTable from "./academics/CourseTable";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Course } from "./types/course";

interface AcademicsSectionProps {
  courses?: Course[];
  onCoursesChange?: (courses: Course[]) => void;
}

export default function AcademicsSection({ courses: externalCourses, onCoursesChange }: AcademicsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    name: "",
    grade: "",
    semester: "",
    course_type: "Regular",
    grade_level: "",
    academic_year: "",
    grade_type: "letter",
  });

  // Generate academic years
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 8 }, (_, i) => {
    const year = currentYear - 4 + i;
    return `${year}-${year + 1}`;
  });

  // Fetch courses from Supabase
  const { data: fetchedCourses = [], refetch } = useQuery({
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
    enabled: true, // Always enable the query
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Refetch when component mounts
  });

  const courses = externalCourses || fetchedCourses;

  // Add course mutation
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
      await refetch(); // Explicitly refetch after invalidation
      toast({
        title: "Success",
        description: "Course added successfully",
      });
      setNewCourse({
        name: "",
        grade: "",
        semester: "",
        course_type: "Regular",
        grade_level: "",
        academic_year: "",
        grade_type: "letter",
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

  // Update course mutation
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

  // Update parent components when courses change
  useEffect(() => {
    if (onCoursesChange && courses) {
      console.log("Updating parent with new courses:", courses);
      onCoursesChange(courses);
    }
  }, [courses, onCoursesChange]);

  const handleAddCourse = async () => {
    if (newCourse.name && newCourse.grade && newCourse.semester && newCourse.grade_level && newCourse.academic_year) {
      console.log('Handling add course:', newCourse);
      await addCourseMutation.mutateAsync(newCourse as Omit<Course, 'id'>);
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    console.log('Handling edit course:', course);
    setEditingCourse(course);
  };

  const handleSaveEdit = () => {
    if (editingCourse) {
      console.log('Saving edited course:', editingCourse);
      updateCourseMutation.mutate(editingCourse);
      setEditingCourse(null);
    }
  };

  const handleCourseChange = (field: string, value: string) => {
    setNewCourse({ ...newCourse, [field]: value });
  };

  const handleEditingCourseChange = (field: string, value: string) => {
    if (editingCourse) {
      setEditingCourse({ ...editingCourse, [field]: value });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Academic Records</CardTitle>
          <GradeCalculator courses={courses} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <CourseForm
          newCourse={newCourse}
          onCourseChange={handleCourseChange}
          onAddCourse={handleAddCourse}
          academicYears={academicYears}
        />
        <CourseTable
          courses={courses}
          editingCourse={editingCourse}
          onEditCourse={handleEditCourse}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingCourse(null)}
          onEditingCourseChange={handleEditingCourseChange}
          academicYears={academicYears}
        />
      </CardContent>
    </Card>
  );
}