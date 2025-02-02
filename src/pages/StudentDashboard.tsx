import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useStudentData } from "@/hooks/student/useStudentData";
import { useStudentRealtime } from "@/hooks/student/useStudentRealtime";
import { useTodos } from "@/hooks/useTodos";
import { useQueryClient } from "@tanstack/react-query";

export default function StudentDashboard() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();
  console.log("StudentDashboard - Student ID:", studentId);

  // Set up real-time subscriptions
  useStudentRealtime(studentId, queryClient);

  // Fetch student data
  const {
    courses,
    activities,
    notes,
    isLoading,
  } = useStudentData(studentId);

  // Use the useTodos hook to get real-time todo data
  const { todos, isLoading: isTodosLoading } = useTodos();

  if (isLoading || isTodosLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const todoStats = {
    completed: todos.filter(todo => todo.completed).length,
    starred: todos.filter(todo => todo.starred).length,
    total: todos.length,
  };

  console.log("StudentDashboard - Current todo stats:", todoStats);

  const transformedActivities = activities.map(activity => ({
    timeCommitment: activity.time_commitment || "",
  }));

  if (!studentId) return null;

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader />
        <div className="mt-8">
          <StatisticsCards 
            courses={courses}
            activities={transformedActivities}
            notes={notes}
            todoStats={todoStats}
          />
        </div>
        <div className="mt-8">
          <DashboardTabs studentId={studentId} />
        </div>
      </div>
    </div>
  );
}