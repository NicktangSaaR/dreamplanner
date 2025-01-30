import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, CheckCircle2, ListTodo, StickyNote, Star } from "lucide-react";
import { calculateGPA, GRADE_TO_GPA } from "./academics/GradeCalculator";

interface StatisticsCardsProps {
  courses: Array<{
    grade: string;
    course_type: string;
    grade_type?: string;
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
  console.log("StatisticsCards - Current notes count:", notes.length);

  const calculateCurrentGPA = () => {
    if (courses.length === 0) return "0.00";
    const validCourses = courses.filter(course => course.grade !== "In Progress");
    if (validCourses.length === 0) return "0.00";
    
    const totalGPA = validCourses.reduce((sum, course) => {
      return sum + calculateGPA(course.grade, course.course_type || 'Regular', course.grade_type);
    }, 0);
    
    return (totalGPA / validCourses.length).toFixed(2);
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

  const getGradeDistribution = (courses: Array<{ grade: string }>) => {
    const distribution = courses.reduce((acc: { [key: string]: number }, course) => {
      const grade = course.grade.charAt(0); // Get just the letter grade
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});
    return distribution;
  };

  const getCourseTypeDistribution = (courses: Array<{ course_type: string }>) => {
    const distribution = courses.reduce((acc: { [key: string]: number }, course) => {
      const type = course.course_type || 'Regular';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return distribution;
  };

  const gradeDistribution = getGradeDistribution(courses);
  const courseTypeDistribution = getCourseTypeDistribution(courses);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="text-2xl font-bold">GPA: {calculateCurrentGPA()}</div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
            <div className="space-y-1">
              <p className="text-xs font-medium">Grades:</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(gradeDistribution).map(([grade, count]) => (
                  <span key={grade} className="text-xs bg-white/50 px-2 py-1 rounded">
                    {grade}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium">Course Types:</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(courseTypeDistribution).map(([type, count]) => (
                  <span key={type} className="text-xs bg-white/50 px-2 py-1 rounded">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
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
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{calculateWeeklyHours(activities)} hours/week total</p>
            {activities.length > 0 && (
              <p className="text-xs">
                ~{(calculateWeeklyHours(activities) / activities.length).toFixed(1)} hours per activity
              </p>
            )}
          </div>
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
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Last updated: {getLastUpdateDate(notes)}</p>
            {notes.length > 0 && (
              <p className="text-xs">
                {notes.length} total entries
              </p>
            )}
          </div>
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
          <div className="space-y-1">
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
            {todoStats.total > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.round((todoStats.completed / todoStats.total) * 100)}% completed
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}