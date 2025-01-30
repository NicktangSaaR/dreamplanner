import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GradeTypeSelect from "./course-form/GradeTypeSelect";
import CourseTypeSelect from "./course-form/CourseTypeSelect";
import GradeInput from "./course-form/GradeInput";
import AcademicYearSelect from "./course-form/AcademicYearSelect";

interface CourseFormProps {
  newCourse: {
    name: string;
    grade: string;
    semester: string;
    course_type: string;
    grade_level: string;
    academic_year: string;
    grade_type: string;
  };
  onCourseChange: (field: string, value: string) => void;
  onAddCourse: () => void;
  academicYears: string[];
}

export default function CourseForm({
  newCourse,
  onCourseChange,
  onAddCourse,
  academicYears,
}: CourseFormProps) {
  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddCourse();
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="name">Course Name</Label>
          <Input
            id="name"
            value={newCourse.name}
            onChange={(e) => onCourseChange('name', e.target.value)}
            placeholder="Enter course name"
            className="mt-1"
          />
        </div>

        <GradeTypeSelect
          value={newCourse.grade_type}
          onChange={(value) => onCourseChange('grade_type', value)}
        />

        <GradeInput
          gradeType={newCourse.grade_type}
          value={newCourse.grade}
          onChange={(value) => onCourseChange('grade', value)}
        />

        <CourseTypeSelect
          value={newCourse.course_type}
          onChange={(value) => onCourseChange('course_type', value)}
        />

        <div>
          <Label htmlFor="grade_level">Grade Level</Label>
          <Select
            value={newCourse.grade_level}
            onValueChange={(value) => onCourseChange('grade_level', value)}
          >
            <SelectTrigger id="grade_level" className="mt-1">
              <SelectValue placeholder="Select grade level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9">9th Grade</SelectItem>
              <SelectItem value="10">10th Grade</SelectItem>
              <SelectItem value="11">11th Grade</SelectItem>
              <SelectItem value="12">12th Grade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AcademicYearSelect
          value={newCourse.academic_year}
          onChange={(value) => onCourseChange('academic_year', value)}
          academicYears={academicYears}
        />

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="semester">Semester</Label>
            <Input
              id="semester"
              value={newCourse.semester}
              onChange={(e) => onCourseChange('semester', e.target.value)}
              placeholder="Enter semester"
              className="mt-1"
            />
          </div>
          <Button onClick={handleSubmit} className="mb-[1px]">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </div>
      </div>
    </div>
  );
}