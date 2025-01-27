import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, CheckCircle2, ListTodo, StickyNote, Star } from "lucide-react";

interface StatisticsCardsProps {
  courses: Array<{
    grade: string;
  }>;
  activities: Array<{
    timeCommitment: string;
  }>;
  notes: Array<{
    date: string;
  }>;
  todoStats: {
    completed: number;
    starred: number;
    total: number;
  };
}

export default function StatisticsCards({ courses, activities, notes, todoStats }: StatisticsCardsProps) {
  const calculateGPA = (courses: Array<{ grade: string }>) => {
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

  const calculateWeeklyHours = (activities: Array<{ timeCommitment: string }>) => {
    return activities.reduce((total, activity) => {
      const hours = activity.timeCommitment.match(/(\d+)\s*hours?\/week/i);
      return total + (hours ? parseInt(hours[1]) : 0);
    }, 0);
  };

  const getLastUpdateDate = (notes: Array<{ date: string }>) => {
    if (notes.length === 0) return "No updates";
    const dates = notes.map(note => new Date(note.date));
    const latestDate = new Date(Math.max(...dates.map(date => date.getTime())));
    return latestDate.toLocaleDateString();
  };

  return (
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
  );
}