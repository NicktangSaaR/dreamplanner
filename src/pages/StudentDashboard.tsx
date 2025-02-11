
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useStudentData } from "@/hooks/student/useStudentData";
import { useStudentRealtime } from "@/hooks/student/useStudentRealtime";
import { useTodos } from "@/hooks/useTodos";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function StudentDashboard() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();
  console.log("StudentDashboard - Student ID:", studentId);

  // Set up real-time subscriptions
  useStudentRealtime(studentId, queryClient);

  // Fetch student data
  const {
    profile,
    courses,
    activities,
    notes,
    isLoading,
  } = useStudentData(studentId);

  // Use the useTodos hook to get real-time todo data
  const { todos, isLoading: isTodosLoading } = useTodos();

  // Set up real-time subscription for courses
  useEffect(() => {
    if (!studentId) return;

    console.log("Setting up real-time subscription for courses...");
    const channel = supabase
      .channel('courses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `student_id=eq.${studentId}`,
        },
        async (payload) => {
          console.log('Course updated, refreshing...', payload);
          await queryClient.invalidateQueries({ 
            queryKey: ["student-courses", studentId] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up courses subscription");
      channel.unsubscribe();
    };
  }, [studentId, queryClient]);

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
