import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ToggleTodoParams {
  id: string;
  completed?: boolean;
  starred?: boolean;
}

export function useToggleTodo() {
  const queryClient = useQueryClient();

  const toggleStatus = useMutation({
    mutationFn: async ({ id, completed }: ToggleTodoParams) => {
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
      console.error("Toggle todo status error:", error);
    },
  });

  const toggleStarred = useMutation({
    mutationFn: async ({ id, starred }: ToggleTodoParams) => {
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
      toast.error("Failed to update todo star status");
      console.error("Toggle todo star error:", error);
    },
  });

  return { toggleStatus, toggleStarred };
}