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

  // Generate academic years - now includes 4 years in the past
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 8 }, (_, i) => {
    const year = currentYear - 4 + i;
    return `${year}-${year + 1}`;
  });

  // Fetch courses from Supabase only if external courses are not provided
  const { data: fetchedCourses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      if (externalCourses) {
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
    enabled: !externalCourses, // Only run the query if external courses are not provided
  });

  const courses = externalCourses || fetchedCourses;

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

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
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

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
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
      onCoursesChange(courses);
    }
  }, [courses, onCoursesChange]);

  const handleAddCourse = () => {
    if (newCourse.name && newCourse.grade && newCourse.semester && newCourse.grade_level && newCourse.academic_year) {
      addCourseMutation.mutate(newCourse as Omit<Course, 'id'>);

      setNewCourse({
        name: "",
        grade: "",
        semester: "",
        course_type: "Regular",
        grade_level: "",
        academic_year: "",
        grade_type: "letter",
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
  };

  const handleSaveEdit = () => {
    if (editingCourse) {
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
