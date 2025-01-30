import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateTodoParams {
  title: string;
  authorId?: string;
}

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, authorId }: CreateTodoParams) => {
      console.log("Creating todo with title:", title, "for author:", authorId);
      const { data, error } = await supabase
        .from("todos")
        .insert([
          {
            title,
            author_id: authorId,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating todo:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.success("Todo created successfully");
    },
    onError: (error) => {
      console.error("Error in createTodo mutation:", error);
      toast.error("Failed to create todo");
    },
  });
}