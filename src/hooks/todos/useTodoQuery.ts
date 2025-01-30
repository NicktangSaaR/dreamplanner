import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  starred: boolean;
  author_id: string;
}

export function useTodoQuery() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Todo[];
    },
  });
}