import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useTodos } from "@/hooks/useTodos";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SelectCounselorDialog from "@/components/college-planning/SelectCounselorDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export default function StudentDashboard() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const { todos } = useTodos();

  // 检查访问权限
  const { data: hasAccess } = useQuery({
    queryKey: ["check-student-access", studentId, profile?.id],
    queryFn: async () => {
      if (!profile?.id || !studentId) return false;
      
      console.log("Checking access rights for student dashboard");
      // 如果是学生本人访问
      if (profile.id === studentId) {
        console.log("Student accessing own dashboard");
        return true;
      }
      
      // 如果是辅导员访问
      if (profile.user_type === 'counselor') {
        const { data, error } = await supabase
          .from("counselor_student_relationships")
          .select("*")
          .eq("counselor_id", profile.id)
          .eq("student_id", studentId)
          .maybeSingle();

        if (error) {
          console.error("Error checking counselor relationship:", error);
          return false;
        }

        console.log("Counselor relationship check result:", data);
        return !!data;
      }

      return false;
    },
    enabled: !!profile?.id && !!studentId,
  });

  // Fetch student profile data
  const { data: studentProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      console.log("Fetching student profile data");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) {
        console.error("Error fetching student profile:", error);
        throw error;
      }

      console.log("Student profile data:", data);
      return data;
    },
    enabled: !!studentId,
  });

  useEffect(() => {
    if (!profile) return;
    
    // 如果没有访问权限，重定向到适当的页面
    if (hasAccess === false) {
      console.log("Access denied to student dashboard");
      navigate('/college-planning');
    }
  }, [profile, hasAccess, navigate]);

  const getTodoStats = () => {
    const completed = todos.filter(todo => todo.completed).length;
    const starred = todos.filter(todo => todo.starred).length;
    const total = todos.length;
    return { completed, starred, total };
  };

  // 如果正在检查权限，显示加载状态
  if (hasAccess === undefined) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/college-planning')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            {studentProfile && (
              <p className="text-lg text-muted-foreground mt-1">
                {studentProfile.full_name}
              </p>
            )}
          </div>
        </div>
        {/* Only show Select Counselor button if viewing as the student */}
        {profile?.id === studentId && (
          <SelectCounselorDialog 
            studentId={studentId}
            onCounselorSelected={() => {}}
          />
        )}
      </div>

      <StatisticsCards
        courses={courses}
        activities={activities}
        notes={notes}
        todoStats={getTodoStats()}
      />

      <DashboardTabs
        courses={courses}
        onCoursesChange={setCourses}
        onActivitiesChange={setActivities}
        onNotesChange={setNotes}
      />
    </div>
  );
}