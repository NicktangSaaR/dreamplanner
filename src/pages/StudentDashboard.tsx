
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useStudentData } from "@/hooks/student/useStudentData";
import { useStudentRealtime } from "@/hooks/student/useStudentRealtime";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function StudentDashboard() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error checking session:", error);
          toast.error("会话检查失败");
          navigate('/login');
          return;
        }

        if (!session) {
          console.log("No active session, redirecting to login");
          toast.error("请先登录");
          navigate('/login');
          return;
        }

        setIsAuthChecking(false);
      } catch (error) {
        console.error("Error in auth check:", error);
        toast.error("认证检查失败");
        navigate('/login');
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        console.log("No session in StudentDashboard, redirecting to login");
        toast.error("会话已过期，请重新登录");
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Fetch counselor relationship
  const { data: counselorRelationship } = useQuery({
    queryKey: ["counselor-relationship", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counselor_student_relationships")
        .select(`
          counselor_id,
          counselor:profiles!counselor_student_relationships_counselor_profiles_fkey(
            full_name
          )
        `)
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching counselor relationship:", error);
        return null;
      }
      return data;
    },
    enabled: !!studentId
  });

  console.log("StudentDashboard - Student ID:", studentId);

  // Set up real-time subscriptions
  useStudentRealtime(studentId, queryClient);

  // Fetch student data
  const {
    profile,
    courses,
    activities,
    notes,
    isLoading: isDataLoading,
  } = useStudentData(studentId);

  // Check profile completeness and show persistent toast
  useEffect(() => {
    if (profile) {
      const requiredFields = {
        '学校信息': profile.school,
        '年级信息': profile.grade,
        '辅导员': counselorRelationship
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([field]) => field);

      if (missingFields.length > 0) {
        toast.warning(
          <div className="flex flex-col gap-4">
            <p>请完善以下必要信息：{missingFields.join('、')}</p>
            <Button 
              onClick={() => navigate('/student-profile')}
              variant="outline"
              size="sm"
            >
              前往设置
            </Button>
          </div>,
          {
            duration: 0, // Toast will stay until dismissed
            position: "top-center",
          }
        );
      }
    }
  }, [profile, counselorRelationship, navigate]);

  if (isAuthChecking || isDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const transformedActivities = activities.map(activity => ({
    timeCommitment: activity.time_commitment || "",
  }));

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader />
        <div className="mt-8">
          <StatisticsCards 
            courses={courses}
            activities={transformedActivities}
            notes={notes}
            studentId={studentId || ''} 
          />
        </div>
        <div className="mt-8">
          <DashboardTabs
            courses={courses}
            onCoursesChange={(newCourses) => {
              queryClient.setQueryData(["student-courses", studentId], newCourses);
            }}
            onActivitiesChange={(newActivities) => {
              queryClient.setQueryData(["student-activities", studentId], newActivities);
            }}
            onNotesChange={(newNotes) => {
              queryClient.setQueryData(["student-notes", studentId], newNotes);
            }}
          />
        </div>
      </div>
    </div>
  );
}
