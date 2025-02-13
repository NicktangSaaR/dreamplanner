
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
import { Toaster } from "@/components/ui/sonner";

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
  const { data: counselorRelationship, isSuccess: isCounselorCheckComplete } = useQuery({
    queryKey: ["counselor-relationship", studentId],
    queryFn: async () => {
      console.log("Fetching counselor relationship for student:", studentId);
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
      console.log("Counselor relationship data:", data);
      return data;
    },
    enabled: !!studentId
  });

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
    // 仅在所有数据都加载完成后进行检查
    if (!isDataLoading && isCounselorCheckComplete && profile) {
      console.log("Checking profile completeness:", {
        profile,
        counselorRelationship,
        isDataLoading,
        isCounselorCheckComplete
      });

      const profileFields = {
        '学校信息': profile.school,
        '年级信息': profile.grade,
      };

      const missingProfileFields = Object.entries(profileFields)
        .filter(([_, value]) => !value)
        .map(([field]) => field);

      // 分开检查辅导员关系
      if (!counselorRelationship) {
        console.log("No counselor relationship found, showing warning");
        toast.warning(
          <div className="flex flex-col gap-4">
            <p>您还未关联辅导员，请先选择或添加辅导员</p>
            <Button 
              onClick={() => navigate('/select-counselor')}
              variant="outline"
              size="sm"
            >
              选择辅导员
            </Button>
          </div>,
          {
            duration: 0,
            position: "top-center",
            id: "counselor-warning" // 添加唯一ID防止重复显示
          }
        );
      }

      // 如果有其他缺失的个人信息，显示单独的提示
      if (missingProfileFields.length > 0) {
        console.log("Missing profile fields:", missingProfileFields);
        toast.warning(
          <div className="flex flex-col gap-4">
            <p>请完善以下必要信息：{missingProfileFields.join('、')}</p>
            <Button 
              onClick={() => navigate('/student-profile')}
              variant="outline"
              size="sm"
            >
              前往设置
            </Button>
          </div>,
          {
            duration: 0,
            position: "top-center",
            id: "profile-warning" // 添加唯一ID防止重复显示
          }
        );
      }
    }
  }, [profile, counselorRelationship, isDataLoading, isCounselorCheckComplete, navigate]);

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
    <>
      <Toaster />
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
    </>
  );
}
