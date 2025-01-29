import { Table, TableBody } from "@/components/ui/table";
import { Course } from "../types/course";
import CourseTableHeader from "./table/CourseTableHeader";
import CourseTableRow from "./table/CourseTableRow";
import EditableCourseRow from "./table/EditableCourseRow";

interface CourseTableProps {
  courses: Course[];
  editingCourse: Course | null;
  onEditCourse: (course: Course) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingCourseChange: (field: string, value: string) => void;
  academicYears: string[];
  isLoading?: boolean;
}

export default function CourseTable({
  courses,
  editingCourse,
  onEditCourse,
  onSaveEdit,
  onCancelEdit,
  onEditingCourseChange,
  academicYears,
  isLoading
}: CourseTableProps) {
  console.log("CourseTable - Current courses:", courses);
  console.log("CourseTable - Loading state:", isLoading);

  if (isLoading) {
    return <div className="text-center py-4">Loading courses...</div>;
  }

  // Ensure courses is an array and has items
  const coursesArray = Array.isArray(courses) ? courses : [];
  console.log("CourseTable - Processed courses array:", coursesArray);
  
  if (!coursesArray || coursesArray.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No courses added yet</div>;
  }

  return (
    <Table>
      <CourseTableHeader />
      <TableBody>
        {coursesArray.map((course) => {
          console.log("Rendering course:", course);
          return editingCourse?.id === course.id ? (
            <EditableCourseRow
              key={course.id}
              editingCourse={editingCourse}
              onEditingCourseChange={onEditingCourseChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              academicYears={academicYears}
            />
          ) : (
            <CourseTableRow
              key={course.id}
              course={course}
              onEditCourse={onEditCourse}
            />
          );
        })}
      </TableBody>
    </Table>
  );
}