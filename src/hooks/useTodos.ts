import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  starred: boolean;
  due_date: string | null;
  author_id: string;
}

export function useTodos() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        return [];
      }
      return data as Todo[];
    },
  });

  const createTodo = useMutation({
    mutationFn: async (title: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("todos")
        .insert([{ title, author_id: userData.user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.success("Todo created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create todo");
      setError(error.message);
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
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      toast.error("Failed to update todo status");
      setError(error.message);
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
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      toast.error("Failed to update star status");
      setError(error.message);
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
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      toast.error("Failed to update todo");
      setError(error.message);
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.success("Todo deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete todo");
      setError(error.message);
    },
  });

  return {
    todos,
    isLoading,
    error,
    createTodo,
    toggleTodoStatus,
    toggleStarred,
    updateTodo,
    deleteTodo,
  };
}