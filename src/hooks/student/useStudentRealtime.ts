
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";

export const useStudentRealtime = (studentId: string | undefined, queryClient: QueryClient) => {
  useEffect(() => {
    if (!studentId) return;

    console.log("Setting up realtime subscriptions for student:", studentId);

    const channel = supabase.channel('student_data_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          console.log('Courses changed, refreshing...', payload);
          queryClient.invalidateQueries({ queryKey: ["student-courses", studentId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extracurricular_activities',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          console.log('Activities changed, refreshing...', payload);
          queryClient.invalidateQueries({ queryKey: ["student-activities", studentId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `author_id=eq.${studentId}`,
        },
        (payload) => {
          console.log('Notes changed, refreshing...', payload);
          queryClient.invalidateQueries({ queryKey: ["student-notes", studentId] });
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up realtime subscriptions");
      channel.unsubscribe();
    };
  }, [studentId, queryClient]);
};
