
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { GPACalculationType } from "../academics/GPATypeSelector";
import { 
  calculateGPA, 
  getGPALabel, 
  getGPAScale, 
  getCourseTypeDistribution,
  calculateCollegeGPA40,
  calculateCollegeGPA433
} from "./utils/gpaUtils";

interface AcademicsCardProps {
  courses: Array<{
    grade: string;
    course_type: string;
    grade_type?: string;
    grade_level?: string;
  }>;
}

export default function AcademicsCard({ courses }: AcademicsCardProps) {
  const [gpaType, setGpaType] = useState<GPACalculationType>("unweighted-us");
  
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
    else if (gpaType === "college-gpa-4.0") {
      const totalGPA = validCourses.reduce((sum, course) => {
        return sum + calculateCollegeGPA40(course.grade, course.grade_type);
      }, 0);
      
      return (totalGPA / validCourses.length).toFixed(2);
    }
    else if (gpaType === "college-gpa-4.33") {
      const totalGPA = validCourses.reduce((sum, course) => {
        return sum + calculateCollegeGPA433(course.grade, course.grade_type);
      }, 0);
      
      return (totalGPA / validCourses.length).toFixed(2);
    }
    else {
      // Regular weighted GPA
      const totalGPA = validCourses.reduce((sum, course) => {
        return sum + calculateGPA(course.grade, course.course_type || 'Regular', course.grade_type);
      }, 0);
      
      return (totalGPA / validCourses.length).toFixed(2);
    }
  };

  const courseTypeDistribution = getCourseTypeDistribution(courses);

  return (
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
              <option value="college-gpa-4.0">US College GPA (4.0 Scale)</option>
              <option value="college-gpa-4.33">US College GPA (4.33 Scale)</option>
              <option value="100-point">100分制平均分</option>
            </select>
            <p className="text-sm text-muted-foreground">{getGPALabel(gpaType)}</p>
            <p className="text-2xl font-bold">GPA: {calculateCurrentGPA()}{getGPAScale(gpaType)}</p>
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
  );
}
