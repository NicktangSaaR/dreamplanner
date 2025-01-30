import { Table, TableBody } from "@/components/ui/table";
import { Course } from "../types/course";
import CourseTableHeader from "./table/CourseTableHeader";
import CourseTableRow from "./table/CourseTableRow";
import EditableCourseRow from "./table/EditableCourseRow";
import { Skeleton } from "@/components/ui/skeleton";
import { memo } from "react";

interface CourseTableProps {
  courses: Course[];
  editingCourse: Course | null;
  onEditCourse: (course: Course) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingCourseChange: (field: string, value: string) => void;
  onDeleteCourse?: (courseId: string) => void;
  academicYears: string[];
  isLoading?: boolean;
}

const CourseTable = memo(function CourseTable({
  courses,
  editingCourse,
  onEditCourse,
  onSaveEdit,
  onCancelEdit,
  onEditingCourseChange,
  onDeleteCourse,
  academicYears,
  isLoading
}: CourseTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  const coursesArray = Array.isArray(courses) ? courses : [];
  
  if (!coursesArray || coursesArray.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>No courses added yet</p>
        <p className="text-sm mt-1">Add your first course using the form above</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <CourseTableHeader />
        <TableBody>
          {coursesArray.map((course) => {
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
                onDeleteCourse={onDeleteCourse}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

export default CourseTable;