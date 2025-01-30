import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StudentViewContent from "@/components/college-planning/student-view/StudentViewContent";
import { useStudentData } from "@/hooks/student/useStudentData";
import { useStudentRealtime } from "@/hooks/student/useStudentRealtime";

export default function StudentView() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();

  console.log("StudentView - Viewing student:", studentId);

  // Set up real-time subscriptions
  useStudentRealtime(studentId, queryClient);

  // Fetch student data
  const {
    profile,
    courses,
    activities,
    notes,
    todos,
    isLoading,
  } = useStudentData(studentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div>Student not found</div>;
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