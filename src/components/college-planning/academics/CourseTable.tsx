import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Save, X } from "lucide-react";
import { calculateGPA } from "./GradeCalculator";

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

interface CourseTableProps {
  courses: Course[];
  editingCourse: Course | null;
  onEditCourse: (course: Course) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingCourseChange: (field: string, value: string) => void;
  academicYears: string[];
}

const GRADE_TO_GPA: { [key: string]: number } = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

const COURSE_TYPE_BONUS: { [key: string]: number } = {
  'Regular': 0,
  'Honors': 0.5,
  'AP/IB': 1.0
};

const GRADE_LEVELS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

export default function CourseTable({
  courses,
  editingCourse,
  onEditCourse,
  onSaveEdit,
  onCancelEdit,
  onEditingCourseChange,
  academicYears
}: CourseTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Course Name</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Course Type</TableHead>
          <TableHead>Grade Level</TableHead>
          <TableHead>Academic Year</TableHead>
          <TableHead>Semester</TableHead>
          <TableHead>GPA</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) =>
          editingCourse?.id === course.id ? (
            <TableRow key={course.id}>
              <TableCell>
                <Input
                  value={editingCourse.name}
                  onChange={(e) => onEditingCourseChange('name', e.target.value)}
                />
              </TableCell>
              <TableCell>
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
                {calculateGPA(editingCourse.grade, editingCourse.course_type).toFixed(2)}
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
          ) : (
            <TableRow key={course.id}>
              <TableCell>{course.name}</TableCell>
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
          )
        )}
      </TableBody>
    </Table>
  );
}