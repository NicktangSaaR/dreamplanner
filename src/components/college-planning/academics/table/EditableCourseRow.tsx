import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { calculateGPA, GRADE_TO_GPA, COURSE_TYPE_BONUS } from "../GradeCalculator";
import { Course } from "../../types/course";

interface EditableCourseRowProps {
  editingCourse: Course;
  onEditingCourseChange: (field: string, value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  academicYears: string[];
}

const GRADE_LEVELS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

export default function EditableCourseRow({
  editingCourse,
  onEditingCourseChange,
  onSaveEdit,
  onCancelEdit,
  academicYears,
}: EditableCourseRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Input
          value={editingCourse.name}
          onChange={(e) => onEditingCourseChange('name', e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Select
          value={editingCourse.grade_type || 'letter'}
          onValueChange={(value) => onEditingCourseChange('grade_type', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="letter">Letter Grade</SelectItem>
            <SelectItem value="100-point">100-Point Scale</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        {editingCourse.grade_type === '100-point' ? (
          <Input
            type="number"
            min="0"
            max="100"
            value={editingCourse.grade}
            onChange={(e) => onEditingCourseChange('grade', e.target.value)}
          />
        ) : (
          <Select
            value={editingCourse.grade}
            onValueChange={(value) => onEditingCourseChange('grade', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(GRADE_TO_GPA).map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell>
        <Select
          value={editingCourse.course_type}
          onValueChange={(value) => onEditingCourseChange('course_type', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(COURSE_TYPE_BONUS).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={editingCourse.grade_level}
          onValueChange={(value) => onEditingCourseChange('grade_level', value)}
        >
          <SelectTrigger>
            <SelectValue />
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
        <Select
          value={editingCourse.academic_year}
          onValueChange={(value) => onEditingCourseChange('academic_year', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={editingCourse.semester}
          onChange={(e) => onEditingCourseChange('semester', e.target.value)}
        />
      </TableCell>
      <TableCell>
        {calculateGPA(editingCourse.grade, editingCourse.course_type, editingCourse.grade_type).toFixed(2)}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSaveEdit}
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancelEdit}
        >
          <X className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}