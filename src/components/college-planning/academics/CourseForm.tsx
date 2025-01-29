import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { GRADE_TO_GPA, COURSE_TYPE_BONUS, SPECIAL_GRADES } from "./GradeCalculator";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const handleSubmit = () => {
    console.log("Attempting to add course:", newCourse);
    
    // Validate required fields
    if (!newCourse.name || !newCourse.grade || !newCourse.grade_level || !newCourse.academic_year) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // If validation passes, call onAddCourse
    onAddCourse();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="courseName">Course Name *</Label>
          <Input
            id="courseName"
            value={newCourse.name}
            onChange={(e) => onCourseChange('name', e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="gradeType">Grade Type</Label>
          <Select
            value={newCourse.grade_type || 'letter'}
            onValueChange={(value) => onCourseChange('grade_type', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select grade type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="letter">Letter Grade</SelectItem>
              <SelectItem value="100-point">100-Point Scale</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="grade">Grade *</Label>
          {newCourse.grade_type === '100-point' ? (
            <Select
              value={newCourse.grade}
              onValueChange={(value) => onCourseChange('grade', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(101)].map((_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i}
                  </SelectItem>
                ))}
                {SPECIAL_GRADES.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={newCourse.grade}
              onValueChange={(value) => onCourseChange('grade', value)}
            >
              <SelectTrigger className="mt-1">
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
            <SelectTrigger className="mt-1">
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
          <Label htmlFor="gradeLevel">Grade Level *</Label>
          <Select
            value={newCourse.grade_level}
            onValueChange={(value) => onCourseChange('grade_level', value)}
          >
            <SelectTrigger className="mt-1">
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
          <Label htmlFor="academicYear">Academic Year *</Label>
          <Select
            value={newCourse.academic_year}
            onValueChange={(value) => onCourseChange('academic_year', value)}
          >
            <SelectTrigger className="mt-1">
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
            placeholder="Enter semester"
            className="mt-1"
          />
        </div>
      </div>
      <Button onClick={handleSubmit} className="w-full mt-4">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Course
      </Button>
    </div>
  );
}