
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { GPACalculationType } from "../academics/GPATypeSelector";
import { 
  calculateGPA, 
  getGPALabel, 
  getGPAScale, 
  getCourseTypeDistribution,
  calculateCollegeGPA40,
  calculateCollegeGPA433
} from "./utils/gpaUtils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

interface AcademicsCardProps {
  courses: Array<{
    grade: string;
    course_type: string;
    grade_type?: string;
    grade_level?: string;
  }>;
  studentId?: string;
}

export default function AcademicsCard({ courses, studentId }: AcademicsCardProps) {
  const [gpaType, setGpaType] = useState<GPACalculationType>("unweighted-us");
  const { profile } = useProfile();
  const [manualGpa, setManualGpa] = useState<string>("");
  const [isEditingGpa, setIsEditingGpa] = useState(false);
  const [editGpaValue, setEditGpaValue] = useState("");
  const [savedManualGpa, setSavedManualGpa] = useState<number | null>(null);

  const isCounselor = profile?.user_type === 'counselor' || profile?.user_type === 'admin';

  // Fetch manual GPA from student profile
  useEffect(() => {
    if (!studentId) return;
    const fetchManualGpa = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('manual_gpa')
        .eq('id', studentId)
        .single();
      if (data && (data as any).manual_gpa != null) {
        setSavedManualGpa((data as any).manual_gpa);
        setManualGpa(String((data as any).manual_gpa));
      }
    };
    fetchManualGpa();
  }, [studentId]);

  const handleSaveManualGpa = async () => {
    if (!studentId) return;
    const value = parseFloat(editGpaValue);
    if (isNaN(value) || value < 0 || value > 5) {
      toast.error("请输入有效的GPA值 (0-5)");
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ manual_gpa: value } as any)
      .eq('id', studentId);

    if (error) {
      toast.error("保存失败");
      return;
    }

    setSavedManualGpa(value);
    setManualGpa(String(value));
    setIsEditingGpa(false);
    toast.success("手动GPA已保存");
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
        return sum + calculateGPA(course.grade, 'Regular', course.grade_type);
      }, 0);
      
      return (totalGPA / validCourses.length).toFixed(2);
    }
    else if (gpaType === "uc-gpa") {
      const ucValidCourses = validCourses.filter(course => course.grade_level !== '9');
      if (ucValidCourses.length === 0) return "0.00";
      
      const totalGPA = ucValidCourses.reduce((sum, course) => {
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

          {/* Manual GPA */}
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">手动GPA</p>
              {isCounselor && !isEditingGpa && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => { setIsEditingGpa(true); setEditGpaValue(manualGpa || ""); }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            {isEditingGpa ? (
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={editGpaValue}
                  onChange={(e) => setEditGpaValue(e.target.value)}
                  className="h-7 text-sm"
                  placeholder="例: 3.85"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveManualGpa();
                    if (e.key === 'Escape') setIsEditingGpa(false);
                  }}
                />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleSaveManualGpa}>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsEditingGpa(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-lg font-semibold">
                {savedManualGpa != null ? savedManualGpa : "—"}
              </p>
            )}
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
