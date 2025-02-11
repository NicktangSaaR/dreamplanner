
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
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

  console.log("StudentView - Viewing student:", studentId);

  // Check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No active session, redirecting to login");
          toast.error("Please log in to continue");
          navigate('/login');
          return;
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("Auth state changed:", event);
          if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
            console.log("User signed out or token refresh failed");
            toast.error("Session expired. Please log in again");
            navigate('/login');
          }
        });

        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error checking auth:", error);
        toast.error("Authentication error. Please try logging in again");
        navigate('/login');
      }
    };
    
    checkAuth();
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

  const isLoading = isStudentDataLoading || isTodosLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-4 text-center">Student not found</div>;
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
