import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Pencil, Save, X, Calculator } from "lucide-react";

interface Course {
  id: string;
  name: string;
  grade: string;
  semester: string;
  course_type: string;
  gpa_value?: number;
}

interface AcademicsSectionProps {
  onCoursesChange?: (courses: Course[]) => void;
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

export default function AcademicsSection({ onCoursesChange }: AcademicsSectionProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    name: "",
    grade: "",
    semester: "",
    course_type: "Regular",
  });

  useEffect(() => {
    onCoursesChange?.(courses);
  }, [courses, onCoursesChange]);

  const calculateGPA = (grade: string, courseType: string): number => {
    const baseGPA = GRADE_TO_GPA[grade.toUpperCase()] || 0;
    const bonus = COURSE_TYPE_BONUS[courseType] || 0;
    return baseGPA + bonus;
  };

  const calculateOverallGPA = (): number => {
    if (courses.length === 0) return 0;
    const totalGPA = courses.reduce((sum, course) => {
      return sum + (course.gpa_value || calculateGPA(course.grade, course.course_type));
    }, 0);
    return Number((totalGPA / courses.length).toFixed(2));
  };

  const handleAddCourse = () => {
    if (newCourse.name && newCourse.grade && newCourse.semester) {
      const gpaValue = calculateGPA(newCourse.grade, newCourse.course_type);
      const updatedCourses = [
        ...courses,
        {
          id: Date.now().toString(),
          ...newCourse,
          gpa_value: gpaValue,
        },
      ];
      setCourses(updatedCourses);
      setNewCourse({ name: "", grade: "", semester: "", course_type: "Regular" });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
  };

  const handleSaveEdit = () => {
    if (editingCourse) {
      const gpaValue = calculateGPA(editingCourse.grade, editingCourse.course_type);
      setCourses(
        courses.map((course) =>
          course.id === editingCourse.id 
            ? { ...editingCourse, gpa_value: gpaValue }
            : course
        )
      );
      setEditingCourse(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Academic Records</CardTitle>
          <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
            <Calculator className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-600">Overall GPA</p>
              <p className="text-2xl font-bold text-green-700">{calculateOverallGPA()}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              value={newCourse.name}
              onChange={(e) =>
                setNewCourse({ ...newCourse, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Select
              value={newCourse.grade}
              onValueChange={(value) =>
                setNewCourse({ ...newCourse, grade: value })
              }
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
              onValueChange={(value) =>
                setNewCourse({ ...newCourse, course_type: value })
              }
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
            <Label htmlFor="semester">Semester</Label>
            <Input
              id="semester"
              value={newCourse.semester}
              onChange={(e) =>
                setNewCourse({ ...newCourse, semester: e.target.value })
              }
            />
          </div>
        </div>
        <Button onClick={handleAddCourse} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Course
        </Button>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Course Type</TableHead>
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
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          name: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editingCourse.grade}
                      onValueChange={(value) =>
                        setEditingCourse({
                          ...editingCourse,
                          grade: value,
                        })
                      }
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
                      onValueChange={(value) =>
                        setEditingCourse({
                          ...editingCourse,
                          course_type: value,
                        })
                      }
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
                    <Input
                      value={editingCourse.semester}
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          semester: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {calculateGPA(editingCourse.grade, editingCourse.course_type).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSaveEdit}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCourse(null)}
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
                  <TableCell>{course.semester}</TableCell>
                  <TableCell>{course.gpa_value?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}