
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      console.log("Deleting user:", userId);
      
      // First, get the user type to customize the confirmation message
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('user_type, full_name')
        .eq('id', userId)
        .single();
        
      if (!userProfile) throw new Error("User not found");
      
      // Delete from profiles table (this will cascade to related tables)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;

      // Call the Edge Function to delete the user from auth.users
      const { error: deleteError } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (deleteError) throw deleteError;

      return userProfile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const userType = data.user_type === 'counselor' ? '辅导员' : '学生';
      toast.success(`${userType}${data.full_name ? ` ${data.full_name}` : ''} 已成功删除`);
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast.error("删除用户失败");
    },
  });
};
