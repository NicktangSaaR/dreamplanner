
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, CheckCircle2, ListTodo, StickyNote, Star } from "lucide-react";
import { calculateGPA, calculateUnweightedGPA } from "./academics/utils/gpaCalculations";
import { useStudentTodos } from "@/hooks/todos/useStudentTodos";
import { useState } from "react";
import { GPACalculationType } from "./academics/GPATypeSelector";

interface StatisticsCardsProps {
  courses: Array<{
    grade: string;
    course_type: string;
    grade_type?: string;
    grade_level?: string;
  }>;
  activities: Array<{
    timeCommitment: string;
  }>;
  notes: Array<{
    date: string;
  }>;
  studentId: string;
}

export default function StatisticsCards({ courses, activities, notes, studentId }: StatisticsCardsProps) {
  console.log("StatisticsCards - Current notes count:", notes.length);
  const [gpaType, setGpaType] = useState<GPACalculationType>("unweighted-us");
  
  // Use studentId to fetch todos
  const { todos } = useStudentTodos(studentId);
  
  const todoStats = {
    completed: todos.filter(todo => todo.completed).length,
    starred: todos.filter(todo => todo.starred).length,
    total: todos.length,
  };

  const calculateCurrentGPA = () => {
    if (courses.length === 0) return "0.00";
    const validCourses = courses.filter(course => course.grade !== "In Progress");
    if (validCourses.length === 0) return "0.00";
    
    if (gpaType === "100-point") {
      const totalPoints = validCourses.reduce((sum, course) => {
        if (course.grade_type === '100-point') {
          const points = parseFloat(course.grade);
          return isNaN(points) ? sum : sum + points;
        }
        return sum;
      }, 0);
      
      const valid100PointCourses = validCourses.filter(course => course.grade_type === '100-point');
      if (valid100PointCourses.length === 0) return "0.00";
      
      return (totalPoints / valid100PointCourses.length).toFixed(2);
    } 
    else if (gpaType === "unweighted-us") {
      const totalGPA = validCourses.reduce((sum, course) => {
        // For unweighted, always use 'Regular' as course type
        return sum + calculateGPA(course.grade, 'Regular', course.grade_type);
      }, 0);
      
      return (totalGPA / validCourses.length).toFixed(2);
    }
    else if (gpaType === "uc-gpa") {
      const ucValidCourses = validCourses.filter(course => course.grade_level !== '9');
      if (ucValidCourses.length === 0) return "0.00";
      
      const totalGPA = ucValidCourses.reduce((sum, course) => {
        // For UC GPA, use special calculation with honors/AP bonus
        const baseGPA = calculateGPA(course.grade, 'Regular', course.grade_type);
        const bonus = course.course_type === 'Honors' || course.course_type === 'AP/IB' ? 1.0 : 0;
        return sum + baseGPA + bonus;
      }, 0);
      
      return (totalGPA / ucValidCourses.length).toFixed(2);
    }
    else {
      // Regular weighted GPA
      const totalGPA = validCourses.reduce((sum, course) => {
        return sum + calculateGPA(course.grade, course.course_type || 'Regular', course.grade_type);
      }, 0);
      
      return (totalGPA / validCourses.length).toFixed(2);
    }
  };

  const getGPALabel = () => {
    switch (gpaType) {
      case "100-point": return "100分制平均分";
      case "unweighted-us": return "Unweighted GPA";
      case "uc-gpa": return "UC GPA";
      default: return "GPA";
    }
  };

  const getGPAScale = () => {
    return gpaType === "100-point" ? "" : "/4.0";
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

  const getCourseTypeDistribution = (courses: Array<{ course_type: string }>) => {
    const distribution = courses.reduce((acc: { [key: string]: number }, course) => {
      const type = course.course_type || 'Regular';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return distribution;
  };

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
          <div className="space-y-2">
            <div>
              <select 
                className="w-full mb-2 p-1 text-sm rounded border border-gray-300 bg-white/80"
                value={gpaType}
                onChange={(e) => setGpaType(e.target.value as GPACalculationType)}
              >
                <option value="unweighted-us">Unweighted GPA-US</option>
                <option value="uc-gpa">UC GPA</option>
                <option value="100-point">100分制平均分</option>
              </select>
              <p className="text-sm text-muted-foreground">{getGPALabel()}</p>
              <p className="text-2xl font-bold">GPA: {calculateCurrentGPA()}{getGPAScale()}</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-2 mt-2">
            <p>{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(courseTypeDistribution).map(([type, count]) => (
                <span key={type} className="text-xs bg-white/50 px-2 py-1 rounded">
                  {type}: {count}
                </span>
              ))}
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
