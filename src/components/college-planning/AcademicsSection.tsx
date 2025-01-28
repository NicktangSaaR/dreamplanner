import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GradeCalculator from "./academics/GradeCalculator";
import CourseForm from "./academics/CourseForm";
import CourseTable from "./academics/CourseTable";

interface Course {
  id: string;
  name: string;
  grade: string;
  semester: string;
  course_type: string;
  gpa_value?: number;
  academic_year?: string;
  grade_level?: string;
}

interface AcademicsSectionProps {
  onCoursesChange?: (courses: Course[]) => void;
}

export default function AcademicsSection({ onCoursesChange }: AcademicsSectionProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    name: "",
    grade: "",
    semester: "",
    course_type: "Regular",
    grade_level: "",
    academic_year: "",
  });

  // Generate academic years
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 4 }, (_, i) => {
    const year = currentYear - 2 + i;
    return `${year}-${year + 1}`;
  });

  useEffect(() => {
    onCoursesChange?.(courses);
  }, [courses, onCoursesChange]);

  const handleAddCourse = () => {
    if (newCourse.name && newCourse.grade && newCourse.semester && newCourse.grade_level && newCourse.academic_year) {
      const gpaValue = calculateGPA(newCourse.grade, newCourse.course_type);
      const updatedCourses = [
        ...courses,
        {
          id: Date.now().toString(),
          ...newCourse,
          gpa_value: gpaValue,
        },
      ];
      setCourses(updatedCourses);
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
      setCourses(
        courses.map((course) =>
          course.id === editingCourse.id 
            ? { ...editingCourse, gpa_value: gpaValue }
            : course
        )
      );
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

  const calculateGPA = (grade: string, courseType: string): number => {
    const baseGPA = GRADE_TO_GPA[grade.toUpperCase()] || 0;
    const bonus = COURSE_TYPE_BONUS[courseType] || 0;
    return baseGPA + bonus;
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