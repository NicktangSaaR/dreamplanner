import { useNavigate } from "react-router-dom";
import { useCounselorStudents } from "@/hooks/useCounselorStudents";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import StudentCard from "@/components/college-planning/StudentCard";
import AddStudentDialog from "@/components/college-planning/AddStudentDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function CounselorDashboard() {
  const navigate = useNavigate();
  const { data: students = [], isLoading } = useCounselorStudents();
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [counselorId, setCounselorId] = useState('');

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Students</h1>
        <Button onClick={() => setShowAddStudent(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
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

      <AddStudentDialog
        counselorId={counselorId}
        onStudentAdded={() => {}}
        open={showAddStudent}
        onOpenChange={setShowAddStudent}
      />
    </div>
  );
}