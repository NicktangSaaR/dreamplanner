import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { GRADE_TO_GPA, COURSE_TYPE_BONUS, SPECIAL_GRADES } from "./GradeCalculator";

interface CourseFormProps {
  newCourse: {
    name: string;
    grade: string;
    semester: string;
    course_type: string;
    grade_level: string;
    academic_year: string;
    grade_type?: string;
  };
  onCourseChange: (field: string, value: string) => void;
  onAddCourse: () => void;
  academicYears: string[];
}

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
          <Label htmlFor="gradeType">Grade Type</Label>
          <Select
            value={newCourse.grade_type || 'letter'}
            onValueChange={(value) => onCourseChange('grade_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="letter">Letter Grade</SelectItem>
              <SelectItem value="100-point">100-Point Scale</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="grade">Grade</Label>
          {newCourse.grade_type === '100-point' ? (
            <Input
              id="grade"
              type="number"
              min="0"
              max="100"
              value={newCourse.grade}
              onChange={(e) => onCourseChange('grade', e.target.value)}
              placeholder="Enter score (0-100)"
            />
          ) : (
            <Select
              value={newCourse.grade}
              onValueChange={(value) => onCourseChange('grade', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {[...Object.keys(GRADE_TO_GPA), ...SPECIAL_GRADES].map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
      </div>
      <Button onClick={onAddCourse} className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Course
      </Button>
    </div>
  );
}