
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { calculateGPA } from "../utils/gpaCalculations";
import { Course } from "../../types/course";
import GradeInput from "../course-form/GradeInput";
import GradeTypeSelect from "../course-form/GradeTypeSelect";
import CourseTypeSelect from "../course-form/CourseTypeSelect";
import AcademicYearSelect from "../course-form/AcademicYearSelect";

interface EditableCourseRowProps {
  editingCourse: Course;
  onEditingCourseChange: (field: string, value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  academicYears: string[];
}

const GRADE_LEVELS = ['9', '10', '11', '12'];

export default function EditableCourseRow({
  editingCourse,
  onEditingCourseChange,
  onSaveEdit,
  onCancelEdit,
  academicYears,
}: EditableCourseRowProps) {
  const gpa = calculateGPA(editingCourse.grade, editingCourse.course_type, editingCourse.grade_type);

  return (
    <TableRow className="bg-muted/30">
      <TableCell>
        <Input
          value={editingCourse.name}
          onChange={(e) => onEditingCourseChange('name', e.target.value)}
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <GradeTypeSelect
          value={editingCourse.grade_type || 'letter'}
          onChange={(value) => onEditingCourseChange('grade_type', value)}
        />
      </TableCell>
      <TableCell>
        <GradeInput
          gradeType={editingCourse.grade_type || 'letter'}
          value={editingCourse.grade}
          onChange={(value) => onEditingCourseChange('grade', value)}
        />
      </TableCell>
      <TableCell>
        <CourseTypeSelect
          value={editingCourse.course_type}
          onChange={(value) => onEditingCourseChange('course_type', value)}
        />
      </TableCell>
      <TableCell>
        <Select
          value={editingCourse.grade_level}
          onValueChange={(value) => onEditingCourseChange('grade_level', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select grade level" />
          </SelectTrigger>
          <SelectContent>
            {GRADE_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <AcademicYearSelect
          value={editingCourse.academic_year || ''}
          onChange={(value) => onEditingCourseChange('academic_year', value)}
          academicYears={academicYears}
        />
      </TableCell>
      <TableCell>
        <Input
          value={editingCourse.semester || ''}
          onChange={(e) => onEditingCourseChange('semester', e.target.value)}
          className="h-8"
          placeholder="e.g. Fall"
        />
      </TableCell>
      <TableCell className="text-right">
        {gpa.toFixed(2)}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onEditingCourseChange('gpa_value', gpa.toString());
              onSaveEdit();
            }}
            className="h-8 w-8"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancelEdit}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
