import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExtracurricularSection from "@/components/college-planning/ExtracurricularSection";
import AcademicsSection from "@/components/college-planning/AcademicsSection";
import NotesSection from "@/components/college-planning/NotesSection";
import TodoSection from "@/components/college-planning/TodoSection";
import ProfileSection from "@/components/college-planning/ProfileSection";
import { BookOpen, Activity, StickyNote, GraduationCap, ListTodo, User, CheckCircle2, Star } from "lucide-react";
import { useTodos } from "@/hooks/useTodos";

interface Course {
  id: string;
  name: string;
  grade: string;
  semester: string;
}

interface ActivityType {
  id: string;
  name: string;
  role: string;
  description: string;
  timeCommitment: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function CollegePlanning() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const { todos } = useTodos();

  // Calculate GPA from courses
  const calculateGPA = (courses: Course[]) => {
    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };

    const validGrades = courses.filter(course => course.grade in gradePoints);
    if (validGrades.length === 0) return 0;

    const totalPoints = validGrades.reduce((sum, course) => 
      sum + (gradePoints[course.grade] || 0), 0);
    return (totalPoints / validGrades.length).toFixed(2);
  };

  // Calculate total weekly hours from activities
  const calculateWeeklyHours = (activities: ActivityType[]) => {
    return activities.reduce((total, activity) => {
      const hours = activity.timeCommitment.match(/(\d+)\s*hours?\/week/i);
      return total + (hours ? parseInt(hours[1]) : 0);
    }, 0);
  };

  // Get the last update date from notes
  const getLastUpdateDate = (notes: Note[]) => {
    if (notes.length === 0) return "No updates";
    const dates = notes.map(note => new Date(note.date));
    const latestDate = new Date(Math.max(...dates.map(date => date.getTime())));
    return latestDate.toLocaleDateString();
  };

  // Calculate todo statistics
  const getTodoStats = () => {
    const completed = todos.filter(todo => todo.completed).length;
    const starred = todos.filter(todo => todo.starred).length;
    const total = todos.length;
    return { completed, starred, total };
  };

  const todoStats = getTodoStats();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">College Planning Dashboard</h1>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Academics
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GPA: {calculateGPA(courses)}</div>
            <p className="text-sm text-muted-foreground">
              {courses.length} course{courses.length !== 1 ? 's' : ''} this semester
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activities
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length} Activities</div>
            <p className="text-sm text-muted-foreground">
              {calculateWeeklyHours(activities)} hours/week total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              <div className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Notes
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notes.length} Notes</div>
            <p className="text-sm text-muted-foreground">
              Last updated: {getLastUpdateDate(notes)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                To-Dos
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoStats.total} Tasks</div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {todoStats.completed} Done
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400" />
                {todoStats.starred} Starred
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="academics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="academics" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Academics
          </TabsTrigger>
          <TabsTrigger value="extracurricular" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Extracurricular
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="todos" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            To-Dos
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="academics">
          <AcademicsSection onCoursesChange={setCourses} />
        </TabsContent>
        
        <TabsContent value="extracurricular">
          <ExtracurricularSection onActivitiesChange={setActivities} />
        </TabsContent>
        
        <TabsContent value="notes">
          <NotesSection onNotesChange={setNotes} />
        </TabsContent>

        <TabsContent value="todos">
          <TodoSection />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}