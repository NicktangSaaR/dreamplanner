import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
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

export default function StudentView() {
  const { studentId } = useParams<{ studentId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const isCounselorView = location.pathname.startsWith('/counselor');

  // Check if studentId is valid
  if (!studentId) {
    console.error("No student ID provided");
    toast.error("Invalid student ID");
    navigate(isCounselorView ? '/counselor-dashboard' : '/college-planning');
    return null;
  }

  // Fetch student profile
  const { data: studentProfile, isError: profileError } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      console.log("Fetching student profile data for ID:", studentId);
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
    enabled: !!studentId,
  });

  // Check access rights
  const { data: hasAccess, isError: accessError } = useQuery({
    queryKey: ["check-student-access", studentId, profile?.id],
    queryFn: async () => {
      if (!profile?.id || !studentId) return false;
      
      console.log("Checking access rights for student view");
      
      // If user is viewing their own profile
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

  // Handle errors and access control
  if (profileError || accessError) {
    toast.error("Error loading student data");
    navigate(isCounselorView ? '/counselor-dashboard' : '/college-planning');
    return null;
  }

  if (hasAccess === false) {
    toast.error("You don't have permission to view this page");
    navigate(isCounselorView ? '/counselor-dashboard' : '/college-planning');
    return null;
  }

  const handleBack = () => {
    if (profile?.user_type === 'counselor') {
      navigate('/counselor-dashboard');
    } else {
      navigate('/college-planning');
    }
  };

  const getTodoStats = () => {
    return {
      completed: 0,
      starred: 0,
      total: 0
    };
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isCounselorView ? "Student Dashboard (Counselor View)" : "My Dashboard"}
            </h1>
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
        onCoursesChange={setCourses}
        onActivitiesChange={setActivities}
        onNotesChange={setNotes}
      />
    </div>
  );
}