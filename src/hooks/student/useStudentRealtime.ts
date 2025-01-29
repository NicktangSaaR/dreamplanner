import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";

export const useStudentRealtime = (studentId: string | undefined, queryClient: QueryClient) => {
  useEffect(() => {
    if (!studentId) return;

    const channel = supabase.channel('student_data_changes');

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          console.log('Courses changed, refreshing...');
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
        () => {
          console.log('Activities changed, refreshing...');
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
        () => {
          console.log('Notes changed, refreshing...');
          queryClient.invalidateQueries({ queryKey: ["student-notes", studentId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `author_id=eq.${studentId}`,
        },
        () => {
          console.log('Todos changed, refreshing...');
          queryClient.invalidateQueries({ queryKey: ["student-todos", studentId] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [studentId, queryClient]);
};