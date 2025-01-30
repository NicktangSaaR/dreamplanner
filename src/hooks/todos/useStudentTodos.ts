import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Todo } from "./useTodoQuery";
import { toast } from "sonner";

export function useStudentTodos(studentId: string | undefined) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: todos = [] } = useQuery({
    queryKey: ["student-todos", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      console.log("Fetching todos for student:", studentId);
      
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("author_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching todos:", error);
        setError(error.message);
        return [];
      }

      console.log("Fetched todos:", data);
      return data as Todo[];
    },
    enabled: !!studentId
  });

  const createTodo = useMutation({
    mutationFn: async ({ title, authorId }: { title: string; authorId: string }) => {
      console.log("Creating todo for student:", authorId);
      
      const { data, error } = await supabase
        .from("todos")
        .insert([{ title, author_id: authorId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-todos", studentId] });
      toast.success("Todo created successfully");
    },
    onError: (error) => {
      console.error("Error creating todo:", error);
      toast.error("Failed to create todo");
    },
  });

  const toggleTodoStatus = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from("todos")
        .update({ completed })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-todos", studentId] });
    },
    onError: (error) => {
      console.error("Error toggling todo status:", error);
      toast.error("Failed to update todo status");
    },
  });

  const toggleStarred = useMutation({
    mutationFn: async ({ id, starred }: { id: string; starred: boolean }) => {
      const { data, error } = await supabase
        .from("todos")
        .update({ starred })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-todos", studentId] });
    },
    onError: (error) => {
      console.error("Error toggling todo starred status:", error);
      toast.error("Failed to update todo starred status");
    },
  });

  const updateTodo = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { data, error } = await supabase
        .from("todos")
        .update({ title })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-todos", studentId] });
      toast.success("Todo updated successfully");
    },
    onError: (error) => {
      console.error("Error updating todo:", error);
      toast.error("Failed to update todo");
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-todos", studentId] });
      toast.success("Todo deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting todo:", error);
      toast.error("Failed to delete todo");
    },
  });

  return {
    todos,
    error,
    createTodo,
    toggleTodoStatus,
    toggleStarred,
    updateTodo,
    deleteTodo,
  };
}