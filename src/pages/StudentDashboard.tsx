import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useTodos } from "@/hooks/useTodos";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/components/college-planning/types/course";
import { toast } from "sonner";

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
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const { todos } = useTodos();

  console.log("StudentDashboard - studentId:", studentId);
  console.log("StudentDashboard - profile:", profile);

  // Check access rights
  const { data: hasAccess, isLoading: checkingAccess } = useQuery({
    queryKey: ["check-student-access", studentId, profile?.id],
    queryFn: async () => {
      if (!profile?.id || !studentId) return false;
      
      console.log("Checking access rights for student dashboard");
      
      // If user is viewing their own dashboard
      if (profile.id === studentId) {
        console.log("Student accessing own dashboard");
        return true;
      }
      
      // If user is a counselor, check relationship
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

  // Fetch student profile
  const { data: studentProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("No student ID provided");
      
      console.log("Fetching student profile data");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching student profile:", error);
        throw error;
      }

      console.log("Student profile data:", data);
      return data;
    },
    enabled: !!studentId && hasAccess === true,
  });

  useEffect(() => {
    if (!checkingAccess && hasAccess === false) {
      toast.error("You don't have permission to view this page");
      navigate('/college-planning');
    }
  }, [hasAccess, checkingAccess, navigate]);

  const getTodoStats = () => {
    const completed = todos.filter(todo => todo.completed).length;
    const starred = todos.filter(todo => todo.starred).length;
    const total = todos.length;
    return { completed, starred, total };
  };

  const handleCoursesChange = (newCourses: Course[]) => {
    setCourses(newCourses);
  };

  if (checkingAccess) {
    return <div>Loading...</div>;
  }

  if (!studentId || !hasAccess) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
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
      </div>

      <StatisticsCards
        courses={courses}
        activities={activities}
        notes={notes}
        todoStats={getTodoStats()}
      />

      <DashboardTabs
        courses={courses}
        onCoursesChange={handleCoursesChange}
        onActivitiesChange={setActivities}
        onNotesChange={setNotes}
      />
    </div>
  );
}