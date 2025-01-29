import { useNavigate } from "react-router-dom";
import { useCounselorStudents } from "@/hooks/useCounselorStudents";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import StudentCard from "@/components/college-planning/StudentCard";
import AddStudentDialog from "@/components/college-planning/AddStudentDialog";
import { useState } from "react";

export default function CounselorDashboard() {
  const navigate = useNavigate();
  const { students, isLoading } = useCounselorStudents();
  const [showAddStudent, setShowAddStudent] = useState(false);

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
        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onClick={() => handleStudentClick(student.id)}
          />
        ))}
      </div>

      <AddStudentDialog
        open={showAddStudent}
        onOpenChange={setShowAddStudent}
      />
    </div>
  );
}