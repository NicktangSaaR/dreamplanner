import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStudentData = (studentId: string | undefined) => {
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("No student ID provided");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data;
    },
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["student-activities", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("extracurricular_activities")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data;
    },
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["student-notes", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("author_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: todos = [], isLoading: isLoadingTodos } = useQuery({
    queryKey: ["student-todos", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("author_id", studentId);

      if (error) throw error;
      return data;
    },
  });

  const isLoading = isLoadingProfile || isLoadingCourses || isLoadingActivities || isLoadingNotes || isLoadingTodos;

  return {
    profile,
    courses,
    activities,
    notes,
    todos,
    isLoading,
  };
};