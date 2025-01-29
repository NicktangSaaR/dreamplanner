import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { calculateGPA } from "../GradeCalculator";
import { Course } from "../../types/course";

interface CourseTableRowProps {
  course: Course;
  onEditCourse: (course: Course) => void;
}

export default function CourseTableRow({ course, onEditCourse }: CourseTableRowProps) {
  return (
    <TableRow key={course.id}>
      <TableCell>{course.name}</TableCell>
      <TableCell>{course.grade_type === '100-point' ? '100-Point Scale' : 'Letter Grade'}</TableCell>
      <TableCell>{course.grade}</TableCell>
      <TableCell>{course.course_type}</TableCell>
      <TableCell>{course.grade_level}</TableCell>
      <TableCell>{course.academic_year}</TableCell>
      <TableCell>{course.semester}</TableCell>
      <TableCell>{course.gpa_value?.toFixed(2)}</TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEditCourse(course)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}