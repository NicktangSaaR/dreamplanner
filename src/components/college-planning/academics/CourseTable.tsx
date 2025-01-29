import { Table, TableBody } from "@/components/ui/table";
import { Course } from "../types/course";
import CourseTableHeader from "./table/CourseTableHeader";
import CourseTableRow from "./table/CourseTableRow";
import EditableCourseRow from "./table/EditableCourseRow";
import { Skeleton } from "@/components/ui/skeleton";

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
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  // Ensure courses is an array and has items
  const coursesArray = Array.isArray(courses) ? courses : [];
  console.log("CourseTable - Processed courses array:", coursesArray);
  
  if (!coursesArray || coursesArray.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No courses added yet</p>
        <p className="text-sm mt-2">Add your first course using the form above</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
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
    </div>
  );
}