import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import GradeCalculator from "./academics/GradeCalculator";
import CourseForm from "./academics/CourseForm";
import CourseTable from "./academics/CourseTable";
import { Course } from "./types/course";
import { useCourses } from "@/hooks/useCourses";
import { generateAcademicYears } from "@/utils/academicYears";

interface AcademicsSectionProps {
  courses?: Course[];
  onCoursesChange?: (courses: Course[]) => void;
}

export default function AcademicsSection({ 
  courses: externalCourses, 
  onCoursesChange 
}: AcademicsSectionProps) {
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
  const { courses, isLoading, addCourse, updateCourse } = useCourses(externalCourses);

  useEffect(() => {
    if (onCoursesChange && courses) {
      console.log("Updating parent with new courses:", courses);
      onCoursesChange(courses);
    }
  }, [courses, onCoursesChange]);

  const handleAddCourse = async () => {
    if (newCourse.name && newCourse.grade && newCourse.semester && newCourse.grade_level && newCourse.academic_year) {
      console.log('Handling add course:', newCourse);
      await addCourse(newCourse as Omit<Course, 'id'>);
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
      await updateCourse(editingCourse);
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
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}