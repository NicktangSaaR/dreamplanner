
import { useNavigate } from "react-router-dom";
import { useCounselorStudents } from "@/hooks/useCounselorStudents";
import { Button } from "@/components/ui/button";
import { LogOut, User, BrainCircuit, CheckCircle } from "lucide-react";
import StudentCard from "@/components/college-planning/StudentCard";
import InviteStudentDialog from "@/components/college-planning/InviteStudentDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CounselorDashboard() {
  const navigate = useNavigate();
  const { data: students = [], isLoading, refetch } = useCounselorStudents();
  const [counselorId, setCounselorId] = useState('');
  const [activeStudents, setActiveStudents] = useState<any[]>([]);
  const [completedStudents, setCompletedStudents] = useState<any[]>([]);

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

  // Group students by status when students data changes
  useEffect(() => {
    const active: any[] = [];
    const completed: any[] = [];

    students.forEach(relationship => {
      const student = relationship.students;
      if (student.status === 'Completed') {
        completed.push(relationship);
      } else {
        active.push(relationship);
      }
    });

    setActiveStudents(active);
    setCompletedStudents(completed);
  }, [students]);

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
    window.open('https://chatgpt.com/g/g-67c3ae02ca70819186461af602529c0e-nick-activity-brainstromer', '_blank');
  };

  const handleStatusChange = async (studentId: string, status: string) => {
    // Refetch the students data to update the grouping
    await refetch();
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

      {/* Active Students Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Active Students ({activeStudents.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeStudents.map((relationship) => (
            <StudentCard
              key={relationship.student_id}
              student={relationship.students}
              onClick={() => handleStudentClick(relationship.student_id)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      </div>

      {/* Completed Students Section */}
      {completedStudents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold">Completed Students ({completedStudents.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedStudents.map((relationship) => (
              <StudentCard
                key={relationship.student_id}
                student={relationship.students}
                onClick={() => handleStudentClick(relationship.student_id)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
