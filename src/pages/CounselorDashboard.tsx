import { useNavigate } from "react-router-dom";
import { useCounselorStudents } from "@/hooks/useCounselorStudents";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, User, Video } from "lucide-react";
import StudentCard from "@/components/college-planning/StudentCard";
import InviteStudentDialog from "@/components/college-planning/InviteStudentDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function CounselorDashboard() {
  const navigate = useNavigate();
  const { data: students = [], isLoading, refetch } = useCounselorStudents();
  const [counselorId, setCounselorId] = useState('');
  const [showInviteStudent, setShowInviteStudent] = useState(false);

  useEffect(() => {
    const fetchCounselorId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCounselorId(user.id);
      }
    };
    fetchCounselorId();
  }, []);

  const handleStudentClick = (studentId: string) => {
    navigate(`/counselor-dashboard/student/${studentId}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
            onClick={() => navigate('/mock-interview')}
          >
            <Video className="mr-2 h-4 w-4" />
            Mock Interview
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/counselor-profile')}
          >
            <User className="mr-2 h-4 w-4" />
            My Profile
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