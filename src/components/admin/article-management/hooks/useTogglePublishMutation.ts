
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTogglePublishMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      console.log("Toggling publish status:", { id, published });
      
      const { error } = await supabase
        .from('articles')
        .update({ 
          published,
          publish_date: published ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['published-articles'] });
      toast.success("文章状态已更新");
    },
    onError: (error) => {
      console.error("Error toggling publish status:", error);
      toast.error("更新失败：" + error.message);
    },
  });
}
