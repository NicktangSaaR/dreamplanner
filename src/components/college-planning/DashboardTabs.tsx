import { Activity, BookOpen, Folder, ListTodo, StickyNote } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import ExtracurricularSection from "./ExtracurricularSection";
import NotesSection from "./NotesSection";
import TodoSection from "./TodoSection";
import { calculateGPA } from "./academics/GradeCalculator";

interface Course {
  id: string;
  name: string;
  grade: string;
  semester: string;
  course_type: string;
  grade_type?: string;
}

interface DashboardTabsProps {
  courses: Course[];
  onCoursesChange: (courses: Course[]) => void;
  onActivitiesChange: (activities: any[]) => void;
  onNotesChange: (notes: any[]) => void;
}

export default function DashboardTabs({ 
  courses,
  onCoursesChange, 
  onActivitiesChange, 
  onNotesChange 
}: DashboardTabsProps) {
  const navigate = useNavigate();

  const getCurrentSemester = () => {
    if (!courses.length) return 'N/A';
    const semesters = courses.map(course => course.semester);
    return semesters[semesters.length - 1];
  };

  const getLatestCourse = () => {
    if (!courses.length) return 'N/A';
    return courses[courses.length - 1].name;
  };

  const calculateAverageGrade = () => {
    if (!courses.length) return 'N/A';
    
    const validCourses = courses.filter(course => {
      const specialGrades = ['In Progress', 'Pass/Fail', 'Drop'];
      return !specialGrades.includes(course.grade);
    });

    if (!validCourses.length) return 'N/A';

    const totalGPA = validCourses.reduce((sum, course) => {
      return sum + calculateGPA(course.grade, course.course_type, course.grade_type);
    }, 0);

    return (totalGPA / validCourses.length).toFixed(2);
  };

  return (
    <Tabs defaultValue="academics" className="w-full">
      <div className="grid grid-cols-1 gap-2 mb-8">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full gap-2">
          <TabsTrigger 
            value="academics" 
            className="flex items-center gap-2 data-[state=active]:bg-[#F2FCE2]"
          >
            <BookOpen className="h-4 w-4" />
            Academics
          </TabsTrigger>
          <TabsTrigger 
            value="extracurricular" 
            className="flex items-center gap-2 data-[state=active]:bg-[#FEC6A1]"
          >
            <Activity className="h-4 w-4" />
            Extracurricular
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            className="flex items-center gap-2 data-[state=active]:bg-[#E5DEFF]"
          >
            <StickyNote className="h-4 w-4" />
            Notes & Folders
          </TabsTrigger>
          <TabsTrigger 
            value="todos" 
            className="flex items-center gap-2 data-[state=active]:bg-[#FFDEE2]"
          >
            <ListTodo className="h-4 w-4" />
            To-Dos
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="academics" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Academic Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Average GPA</p>
                <p className="text-2xl font-bold">{calculateAverageGrade()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Semester</p>
                <p className="text-2xl font-bold">{getCurrentSemester()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Latest Course</p>
                <p className="text-2xl font-bold truncate">{getLatestCourse()}</p>
              </div>
            </div>
            <Button 
              className="w-full"
              onClick={() => navigate('/academics')}
            >
              View Full Academic Records
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="extracurricular" className="mt-8">
        <ExtracurricularSection onActivitiesChange={onActivitiesChange} />
      </TabsContent>
      
      <TabsContent value="notes" className="mt-8">
        <NotesSection onNotesChange={onNotesChange} />
      </TabsContent>

      <TabsContent value="todos" className="mt-8">
        <TodoSection />
      </TabsContent>
    </Tabs>
  );
}