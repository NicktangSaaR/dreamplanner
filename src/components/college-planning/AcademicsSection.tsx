import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import GradeCalculator, { calculateGPA, GRADE_TO_GPA, COURSE_TYPE_BONUS } from "./academics/GradeCalculator";
import CourseForm from "./academics/CourseForm";
import CourseTable from "./academics/CourseTable";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Course {
  id: string;
  name: string;
  grade: string;
  semester: string;
  course_type: string;
  gpa_value?: number;
  academic_year?: string;
  grade_level?: string;
  student_id: string;
}

interface AcademicsSectionProps {
  onCoursesChange?: (courses: Course[]) => void;
}

export default function AcademicsSection({ onCoursesChange }: AcademicsSectionProps) {
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
  });

  // Generate academic years - now includes 4 years in the past
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 8 }, (_, i) => {
    const year = currentYear - 4 + i;
    return `${year}-${year + 1}`;
  });

  // Fetch courses from Supabase
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      console.log('Fetching courses from database');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', supabase.auth.getUser().then(response => response.data.user?.id))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }

      console.log('Fetched courses:', data);
      return data as Course[];
    },
  });

  // Add course mutation
  const addCourseMutation = useMutation({
    mutationFn: async (courseData: Omit<Course, 'id'>) => {
      console.log('Adding new course:', courseData);
      const user = await supabase.auth.getUser();
      const student_id = user.data.user?.id;
      
      if (!student_id) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('courses')
        .insert([{ ...courseData, student_id }])
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

  // Update course mutation
  const updateCourseMutation = useMutation({
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

  useEffect(() => {
    onCoursesChange?.(courses);
  }, [courses, onCoursesChange]);

  const handleAddCourse = () => {
    if (newCourse.name && newCourse.grade && newCourse.semester && newCourse.grade_level && newCourse.academic_year) {
      const gpaValue = calculateGPA(newCourse.grade, newCourse.course_type);
      const courseData = {
        ...newCourse,
        gpa_value: gpaValue,
      };

      addCourseMutation.mutate(courseData as Omit<Course, 'id'>);

      setNewCourse({
        name: "",
        grade: "",
        semester: "",
        course_type: "Regular",
        grade_level: "",
        academic_year: "",
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
  };

  const handleSaveEdit = () => {
    if (editingCourse) {
      const gpaValue = calculateGPA(editingCourse.grade, editingCourse.course_type);
      const updatedCourse = {
        ...editingCourse,
        gpa_value: gpaValue,
      };

      updateCourseMutation.mutate(updatedCourse);
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