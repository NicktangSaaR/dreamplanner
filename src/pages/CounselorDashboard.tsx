import { useNavigate } from "react-router-dom";
import { useCounselorStudents } from "@/hooks/useCounselorStudents";
import { Button } from "@/components/ui/button";
import { LogOut, User, BrainCircuit } from "lucide-react";
import StudentCard from "@/components/college-planning/StudentCard";
import InviteStudentDialog from "@/components/college-planning/InviteStudentDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CounselorDashboard() {
  const navigate = useNavigate();
  const { data: students = [], isLoading, refetch } = useCounselorStudents();
  const [counselorId, setCounselorId] = useState('');

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

        setCounselorId(session.user.id);

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

  const handleStudentClick = (studentId: string) => {
    navigate(`/counselor-dashboard/student/${studentId}`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Failed to log out");
    }
  };

  const handleActivityBrainstorming = () => {
    window.open('https://tbox.alipay.com/pro/share/202503APVPPw00291117?platform=WebService', '_blank');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Students</h1>
        <div className="flex items-center gap-4">
          <InviteStudentDialog 
            counselorId={counselorId}
          />
          <Button 
            variant="outline"
            onClick={() => navigate('/counselor-profile')}
          >
            <User className="mr-2 h-4 w-4" />
            My Profile
          </Button>
          <Button 
            variant="outline"
            onClick={handleActivityBrainstorming}
            className="flex items-center gap-2"
          >
            <BrainCircuit className="h-4 w-4" />
            <span>AI Activity Brainstromer</span>
            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded-full">Beta</span>
          </Button>
          <Button 
            variant="outline"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((relationship) => (
          <StudentCard
            key={relationship.student_id}
            student={relationship.students}
            onClick={() => handleStudentClick(relationship.student_id)}
          />
        ))}
      </div>
    </div>
  );
}
