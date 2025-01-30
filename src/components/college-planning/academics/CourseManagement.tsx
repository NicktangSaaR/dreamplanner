import { useState, useCallback, useMemo } from "react";
import { CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import CourseForm from "./CourseForm";
import CourseTable from "./CourseTable";
import { Course } from "../types/course";
import { generateAcademicYears } from "@/utils/academicYears";

interface CourseManagementProps {
  courses: Course[];
  isLoading: boolean;
  studentId?: string;
  addCourse: any;
  updateCourse: any;
  deleteCourse?: (courseId: string) => Promise<void>;
  onCoursesChange?: (courses: Course[]) => void;
}

export default function CourseManagement({
  courses,
  isLoading,
  studentId,
  addCourse,
  updateCourse,
  deleteCourse,
  onCoursesChange,
}: CourseManagementProps) {
  const { toast } = useToast();
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

  const academicYears = generateAcademicYears();

  // Sort courses by academic year (most recent first)
  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => {
      if (!a.academic_year || !b.academic_year) return 0;
      return b.academic_year.localeCompare(a.academic_year);
    });
  }, [courses]);

  const handleAddCourse = useCallback(async () => {
    if (!studentId) {
      toast({
        title: "Error",
        description: "No student ID found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (newCourse.name && newCourse.grade && newCourse.grade_level && newCourse.academic_year) {
      await addCourse.mutate({ ...newCourse, student_id: studentId });
      setNewCourse({
        name: "",
        grade: "",
        semester: "",
        course_type: "Regular",
        grade_level: "",
        academic_year: "",
        grade_type: "letter",
      });
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }
  }, [newCourse, studentId, addCourse, toast]);

  const handleEditCourse = useCallback((course: Course) => {
    setEditingCourse(course);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (editingCourse) {
      await updateCourse.mutate(editingCourse);
      setEditingCourse(null);
    }
  }, [editingCourse, updateCourse]);

  const handleDeleteCourse = useCallback(async (courseId: string) => {
    if (deleteCourse) {
      try {
        await deleteCourse(courseId);
        toast({
          title: "Success",
          description: "Course deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete course",
          variant: "destructive",
        });
      }
    }
  }, [deleteCourse, toast]);

  const handleCourseChange = useCallback((field: string, value: string) => {
    setNewCourse(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEditingCourseChange = useCallback((field: string, value: string) => {
    setEditingCourse(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  return (
    <CardContent className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <CourseForm
          newCourse={newCourse}
          onCourseChange={handleCourseChange}
          onAddCourse={handleAddCourse}
          academicYears={academicYears}
        />
      </div>
      <div className="mt-2">
        <CourseTable
          courses={sortedCourses}
          editingCourse={editingCourse}
          onEditCourse={handleEditCourse}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingCourse(null)}
          onEditingCourseChange={handleEditingCourseChange}
          onDeleteCourse={handleDeleteCourse}
          academicYears={academicYears}
          isLoading={isLoading}
        />
      </div>
    </CardContent>
  );
}