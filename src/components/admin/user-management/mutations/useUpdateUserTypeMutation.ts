import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUpdateUserTypeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newType }: { userId: string; newType: string }) => {
      console.log("Updating user type:", userId, newType);
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newType })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success("用户身份已更新");
    },
    onError: (error) => {
      console.error("Error updating user type:", error);
      toast.error("更新用户身份失败");
    },
  });
};