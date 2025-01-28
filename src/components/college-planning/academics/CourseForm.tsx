import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";

interface CourseFormProps {
  newCourse: {
    name: string;
    grade: string;
    semester: string;
    course_type: string;
    grade_level: string;
    academic_year: string;
  };
  onCourseChange: (field: string, value: string) => void;
  onAddCourse: () => void;
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

export default function CourseForm({ newCourse, onCourseChange, onAddCourse, academicYears }: CourseFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-6 gap-4">
        <div>
          <Label htmlFor="courseName">Course Name</Label>
          <Input
            id="courseName"
            value={newCourse.name}
            onChange={(e) => onCourseChange('name', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select
            value={newCourse.grade}
            onValueChange={(value) => onCourseChange('grade', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(GRADE_TO_GPA).map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="courseType">Course Type</Label>
          <Select
            value={newCourse.course_type}
            onValueChange={(value) => onCourseChange('course_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(COURSE_TYPE_BONUS).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="gradeLevel">Grade Level</Label>
          <Select
            value={newCourse.grade_level}
            onValueChange={(value) => onCourseChange('grade_level', value)}
          >
            <SelectTrigger>
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
        </div>
        <div>
          <Label htmlFor="academicYear">Academic Year</Label>
          <Select
            value={newCourse.academic_year}
            onValueChange={(value) => onCourseChange('academic_year', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="semester">Semester</Label>
          <Input
            id="semester"
            value={newCourse.semester}
            onChange={(e) => onCourseChange('semester', e.target.value)}
          />
        </div>
      </div>
      <Button onClick={onAddCourse} className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Course
      </Button>
    </div>
  );
}