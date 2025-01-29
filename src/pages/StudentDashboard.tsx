import { useParams } from "react-router-dom";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useStudentData } from "@/hooks/student/useStudentData";
import { useQueryClient } from "@tanstack/react-query";
import { useStudentRealtime } from "@/hooks/student/useStudentRealtime";
import { Loader2 } from "lucide-react";

export default function StudentDashboard() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();

  console.log("StudentDashboard - Student ID:", studentId);

  // Set up real-time subscriptions
  useStudentRealtime(studentId, queryClient);

  // Fetch student data using the same hook as StudentView
  const {
    courses = [],
    activities = [],
    notes = [],
    todos = [],
    isLoading,
  } = useStudentData(studentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const todoStats = {
    completed: todos.filter(todo => todo.completed).length,
    starred: todos.filter(todo => todo.starred).length,
    total: todos.length
  };

  const transformedActivities = activities.map(activity => ({
    timeCommitment: activity.time_commitment || "",
  }));

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
          <DashboardTabs
            courses={courses}
            onCoursesChange={(newCourses) => {
              queryClient.setQueryData(["student-courses", studentId], newCourses);
            }}
            onActivitiesChange={(newActivities) => {
              queryClient.setQueryData(["student-activities", studentId], newActivities);
            }}
            onNotesChange={(newNotes) => {
              queryClient.setQueryData(["student-notes", studentId], newNotes);
            }}
          />
        </div>
      </div>
    </div>
  );
}