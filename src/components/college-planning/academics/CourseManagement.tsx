import { useState } from "react";
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
}

export default function CourseManagement({
  courses,
  isLoading,
  studentId,
  addCourse,
  updateCourse,
  deleteCourse,
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

  const handleAddCourse = async () => {
    console.log("Attempting to add course:", newCourse);
    
    if (!studentId) {
      console.error("No student ID provided");
      toast({
        title: "Error",
        description: "No student ID found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (newCourse.name && newCourse.grade && newCourse.grade_level && newCourse.academic_year) {
      console.log('Handling add course:', newCourse);
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
  };

  const handleEditCourse = (course: Course) => {
    console.log('Handling edit course:', course);
    setEditingCourse(course);
  };

  const handleSaveEdit = async () => {
    if (editingCourse) {
      console.log('Saving edited course:', editingCourse);
      await updateCourse.mutate(editingCourse);
      setEditingCourse(null);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (deleteCourse) {
      try {
        await deleteCourse(courseId);
        toast({
          title: "Success",
          description: "Course deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting course:', error);
        toast({
          title: "Error",
          description: "Failed to delete course",
          variant: "destructive",
        });
      }
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
          courses={courses}
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