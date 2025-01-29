import { useParams } from "react-router-dom";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useStudentData } from "@/hooks/student/useStudentData";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function StudentDashboard() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();

  console.log("StudentDashboard - Student ID:", studentId);

  // Memoize the invalidation callbacks to prevent unnecessary re-renders
  const invalidateCourses = useCallback(() => {
    console.log("Courses changed, invalidating query");
    queryClient.invalidateQueries({ queryKey: ["student-courses", studentId] });
  }, [studentId, queryClient]);

  const invalidateActivities = useCallback(() => {
    console.log("Activities changed, invalidating query");
    queryClient.invalidateQueries({ queryKey: ["student-activities", studentId] });
  }, [studentId, queryClient]);

  const invalidateNotes = useCallback(() => {
    console.log("Notes changed, invalidating query");
    queryClient.invalidateQueries({ queryKey: ["student-notes", studentId] });
  }, [studentId, queryClient]);

  const invalidateTodos = useCallback(() => {
    console.log("Todos changed, invalidating query");
    queryClient.invalidateQueries({ queryKey: ["student-todos", studentId] });
  }, [studentId, queryClient]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!studentId) return;

    console.log("Setting up real-time subscriptions for student:", studentId);
    
    const channels = [
      supabase.channel('courses_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `student_id=eq.${studentId}`
        }, invalidateCourses),

      supabase.channel('activities_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'extracurricular_activities',
          filter: `student_id=eq.${studentId}`
        }, invalidateActivities),

      supabase.channel('notes_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `author_id=eq.${studentId}`
        }, invalidateNotes),

      supabase.channel('todos_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `author_id=eq.${studentId}`
        }, invalidateTodos)
    ];

    // Subscribe to all channels
    Promise.all(channels.map(channel => channel.subscribe()));

    // Cleanup function to unsubscribe from all channels
    return () => {
      console.log("Cleaning up real-time subscriptions");
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [studentId, invalidateCourses, invalidateActivities, invalidateNotes, invalidateTodos]);

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