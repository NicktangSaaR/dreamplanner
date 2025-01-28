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

  const { data: hasCounselor, refetch: refetchCounselorStatus } = useQuery({
    queryKey: ["has-counselor", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      
      console.log("Checking if student has counselor");
      const { data, error } = await supabase
        .from("counselor_student_relationships")
        .select("counselor_id")
        .eq("student_id", profile.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking counselor relationship:", error);
        return false;
      }

      console.log("Counselor relationship data:", data);
      return !!data;
    },
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (profile?.user_type !== 'student') {
      navigate('/college-planning');
    }
  }, [profile, navigate]);

  const getTodoStats = () => {
    const completed = todos.filter(todo => todo.completed).length;
    const starred = todos.filter(todo => todo.starred).length;
    const total = todos.length;
    return { completed, starred, total };
  };

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
          <DashboardHeader />
        </div>
        {profile?.id && !hasCounselor && (
          <SelectCounselorDialog 
            studentId={profile.id}
            onCounselorSelected={refetchCounselorStatus}
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