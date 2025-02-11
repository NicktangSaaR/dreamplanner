
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StudentViewContent from "@/components/college-planning/student-view/StudentViewContent";
import { useStudentData } from "@/hooks/student/useStudentData";
import { useStudentRealtime } from "@/hooks/student/useStudentRealtime";
import { useTodos } from "@/hooks/useTodos";
import { toast } from "sonner";

export default function StudentView() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

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

        setIsLoading(false);
      } catch (error) {
        console.error("Error in auth check:", error);
        toast.error("认证检查失败");
        navigate('/login');
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in StudentView:", event);
      if (!session) {
        console.log("No session in StudentView");
        toast.error("会话已过期，请重新登录");
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Set up real-time subscriptions
  useStudentRealtime(studentId, queryClient);

  // Fetch student data
  const {
    profile,
    courses,
    activities,
    notes,
    isLoading: isStudentDataLoading,
  } = useStudentData(studentId);

  // Use the todos hook separately
  const { todos, isLoading: isTodosLoading } = useTodos();

  if (isLoading || isStudentDataLoading || isTodosLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-4 text-center">未找到学生信息</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader />
      <StudentViewContent 
        studentId={studentId || ""}
        profile={profile}
        courses={courses}
        activities={activities}
        notes={notes}
        todos={todos}
      />
    </div>
  );
}
