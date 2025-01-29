import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import TodoSection from "@/components/college-planning/TodoSection";
import StudentProfile from "@/components/college-planning/student-summary/StudentProfile";
import RecentNotes from "@/components/college-planning/student-summary/RecentNotes";
import ActivitiesSection from "@/components/college-planning/student-summary/ActivitiesSection";
import AcademicSection from "@/components/college-planning/student-summary/AcademicSection";
import SharedFolderSection from "@/components/college-planning/student-summary/SharedFolderSection";
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

  const handleNotesChange = () => {
    queryClient.invalidateQueries({ queryKey: ["student-notes", studentId] });
  };

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

  const todoStats = {
    completed: todos.filter(todo => todo.completed).length,
    starred: todos.filter(todo => todo.starred).length,
    total: todos.length,
  };

  const transformedActivities = activities.map(activity => ({
    timeCommitment: activity.time_commitment || "",
  }));

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader />
      
      <div className="space-y-6">
        <StudentProfile profile={profile} />
        
        <StatisticsCards
          courses={courses}
          activities={transformedActivities}
          notes={notes}
          todoStats={todoStats}
        />

        <AcademicSection 
          courses={courses} 
          studentId={studentId || ""}
        />
        
        <ActivitiesSection activities={activities} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TodoSection />
            <SharedFolderSection studentId={studentId || ""} />
          </div>

          <RecentNotes 
            notes={notes} 
            studentId={studentId || ""} 
            onNotesChange={handleNotesChange}
          />
        </div>
      </div>
    </div>
  );
}