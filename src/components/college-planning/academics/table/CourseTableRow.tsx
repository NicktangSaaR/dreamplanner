
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Course } from "../../types/course";
import { calculateGPA } from "../GradeCalculator";

interface CourseTableRowProps {
  course: Course;
  onEditCourse: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
}

export default function CourseTableRow({ 
  course, 
  onEditCourse,
  onDeleteCourse 
}: CourseTableRowProps) {
  const gpa = course.gpa_value ?? calculateGPA(course.grade, course.course_type, course.grade_type);

  return (
    <TableRow key={course.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">{course.name}</TableCell>
      <TableCell>{course.grade_type === '100-point' ? '100-Point Scale' : 'Letter Grade'}</TableCell>
      <TableCell>{course.grade}</TableCell>
      <TableCell>{course.course_type}</TableCell>
      <TableCell>{course.grade_level}</TableCell>
      <TableCell>{course.academic_year}</TableCell>
      <TableCell>{course.semester || '-'}</TableCell>
      <TableCell className="text-right">{gpa.toFixed(2)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEditCourse(course)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {onDeleteCourse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteCourse(course.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
