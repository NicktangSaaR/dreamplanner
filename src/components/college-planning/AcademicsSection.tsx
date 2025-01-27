import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Pencil, Save, X } from "lucide-react";

interface Course {
  id: string;
  name: string;
  grade: string;
  semester: string;
}

export default function AcademicsSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    name: "",
    grade: "",
    semester: "",
  });

  const handleAddCourse = () => {
    if (newCourse.name && newCourse.grade && newCourse.semester) {
      setCourses([
        ...courses,
        {
          id: Date.now().toString(),
          ...newCourse,
        },
      ]);
      setNewCourse({ name: "", grade: "", semester: "" });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
  };

  const handleSaveEdit = () => {
    if (editingCourse) {
      setCourses(
        courses.map((course) =>
          course.id === editingCourse.id ? editingCourse : course
        )
      );
      setEditingCourse(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
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
            <Input
              id="grade"
              value={newCourse.grade}
              onChange={(e) =>
                setNewCourse({ ...newCourse, grade: e.target.value })
              }
            />
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
              <TableHead>Semester</TableHead>
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
                    <Input
                      value={editingCourse.grade}
                      onChange={(e) =>
                        setEditingCourse({
                          ...editingCourse,
                          grade: e.target.value,
                        })
                      }
                    />
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
                  <TableCell>{course.semester}</TableCell>
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