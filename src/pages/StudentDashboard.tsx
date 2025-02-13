
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
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthError, Session, User } from '@supabase/supabase-js';

export default function StudentDashboard() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const { toast } = useToast();

  // Check authentication state and get current user
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error checking session:", error);
          toast({
            title: "Error",
            description: "会话检查失败",
          });
          navigate('/login');
          return;
        }

        if (!session) {
          console.log("No active session, redirecting to login");
          navigate('/login');
          return;
        }

        console.log("Current session user:", session.user.id);
        setIsAuthChecking(false);
      } catch (error) {
        console.error("Error in auth check:", error);
        toast({
          title: "Error",
          description: "认证检查失败",
        });
        navigate('/login');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (!session) {
        queryClient.clear();
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, redirecting to login");
          navigate('/login');
        } else {
          console.log("Session expired, redirecting to login");
          toast({
            title: "Error",
            description: "会话已过期，请重新登录",
          });
          navigate('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, queryClient]);

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
    enabled: !!studentId,
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

  // Show toasts for incomplete profile information
  useEffect(() => {
    if (!isDataLoading && profile) {
      const showProfileWarnings = () => {
        // 检查学校信息是否为空
        if (!profile.school || profile.school.trim() === '') {
          toast({
            variant: "destructive",
            title: "信息未完善",
            description: (
              <div className="flex flex-col gap-4">
                <p>请完善学校信息，这对于您的规划非常重要</p>
                <Button 
                  onClick={() => navigate('/student-profile')}
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white hover:bg-gray-100"
                >
                  前往完善信息
                </Button>
              </div>
            ),
            duration: null,
          });
        }
      };

      showProfileWarnings();
    }
  }, [profile, isDataLoading, navigate, toast]);

  // Show toast for missing counselor relationship
  useEffect(() => {
    if (isCounselorCheckComplete && !counselorRelationship) {
      toast({
        variant: "destructive",
        title: "未关联辅导员",
        description: (
          <div className="flex flex-col gap-4">
            <p>您还未关联辅导员，这将影响您获取专业的指导</p>
            <Button 
              onClick={() => navigate('/student-profile')}
              variant="secondary"
              size="sm"
              className="w-full bg-white hover:bg-gray-100"
            >
              前往个人主页选择辅导员
            </Button>
          </div>
        ),
        duration: null,
      });
    }
  }, [counselorRelationship, isCounselorCheckComplete, navigate, toast]);

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
