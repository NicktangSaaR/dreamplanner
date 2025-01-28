import { Activity, BookOpen, ListTodo, StickyNote, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import ExtracurricularSection from "./ExtracurricularSection";
import NotesSection from "./NotesSection";
import TodoSection from "./TodoSection";
import CollegeListSection from "./CollegeListSection";
import { calculateGPA } from "./academics/GradeCalculator";
import { Course } from "./types/course";

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

  const calculateOverallMetrics = () => {
    if (!courses.length) return { gpa: 'N/A', average: 'N/A' };
    
    const validCourses = courses.filter(course => {
      const specialGrades = ['In Progress', 'Pass/Fail', 'Drop'];
      return !specialGrades.includes(course.grade);
    });

    if (!validCourses.length) return { gpa: 'N/A', average: 'N/A' };

    const letterGradeCourses = validCourses.filter(course => course.grade_type !== '100-point');
    const pointScaleCourses = validCourses.filter(course => course.grade_type === '100-point');

    const gpa = letterGradeCourses.length ? 
      (letterGradeCourses.reduce((sum, course) => 
        sum + (course.gpa_value || calculateGPA(course.grade, course.course_type, course.grade_type)), 0) / letterGradeCourses.length).toFixed(2)
      : 'N/A';

    const average = pointScaleCourses.length ?
      (pointScaleCourses.reduce((sum, course) => 
        sum + parseFloat(course.grade), 0) / pointScaleCourses.length).toFixed(2)
      : 'N/A';

    return { gpa, average };
  };

  const calculateYearlyMetrics = () => {
    const years = Array.from(new Set(courses.map(course => course.academic_year)))
      .filter(Boolean)
      .sort()
      .reverse();

    return years.map(year => {
      const yearCourses = courses.filter(course => 
        course.academic_year === year && 
        !['In Progress', 'Pass/Fail', 'Drop'].includes(course.grade)
      );

      const letterGradeCourses = yearCourses.filter(course => course.grade_type !== '100-point');
      const pointScaleCourses = yearCourses.filter(course => course.grade_type === '100-point');

      const yearGPA = letterGradeCourses.length ?
        (letterGradeCourses.reduce((sum, course) => 
          sum + (course.gpa_value || calculateGPA(course.grade, course.course_type, course.grade_type)), 0) / letterGradeCourses.length).toFixed(2)
        : 'N/A';

      const yearAverage = pointScaleCourses.length ?
        (pointScaleCourses.reduce((sum, course) => 
          sum + parseFloat(course.grade), 0) / pointScaleCourses.length).toFixed(2)
        : 'N/A';

      return { year, gpa: yearGPA, average: yearAverage };
    });
  };

  const { gpa, average } = calculateOverallMetrics();
  const yearlyMetrics = calculateYearlyMetrics();

  return (
    <Tabs defaultValue="academics" className="w-full">
      <div className="grid grid-cols-1 gap-2 mb-8">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full gap-2">
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
          <TabsTrigger 
            value="colleges" 
            className="flex items-center gap-2 data-[state=active]:bg-[#FFE5D9]"
          >
            <GraduationCap className="h-4 w-4" />
            College List
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
                <p className="text-sm font-medium">Overall GPA</p>
                <p className="text-2xl font-bold">{gpa}</p>
              </div>
              {average !== 'N/A' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Overall Average (100-point)</p>
                  <p className="text-2xl font-bold">{average}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="font-medium text-gray-500">Academic Year Breakdown</p>
              <div className="grid gap-3">
                {yearlyMetrics.map(({ year, gpa: yearGPA, average: yearAverage }) => (
                  <div key={year} className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">{year} GPA</p>
                      <p className="text-xl font-bold">{yearGPA}</p>
                    </div>
                    {yearAverage !== 'N/A' && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">{year} Average</p>
                        <p className="text-xl font-bold">{yearAverage}</p>
                      </div>
                    )}
                  </div>
                ))}
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

      <TabsContent value="colleges" className="mt-8">
        <CollegeListSection />
      </TabsContent>
    </Tabs>
  );
}