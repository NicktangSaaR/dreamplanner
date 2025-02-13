
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      console.log("Deleting user:", userId);
      
      // First, get the user type to customize the confirmation message
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, full_name')
        .eq('id', userId)
        .single();
        
      if (profileError || !userProfile) {
        console.error("Error fetching user profile:", profileError);
        throw new Error("User not found");
      }

      try {
        // Call the Edge Function to delete the user from auth.users
        const { error: deleteError } = await supabase.functions.invoke('delete-user', {
          body: { userId }
        });

        if (deleteError) {
          console.error("Edge function error:", deleteError);
          throw deleteError;
        }

        // If edge function succeeds, delete from profiles table
        const { error: profileDeleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
          
        if (profileDeleteError) {
          console.error("Error deleting profile:", profileDeleteError);
          throw profileDeleteError;
        }

        return userProfile;
      } catch (error) {
        console.error("Delete operation failed:", error);
        throw error;
      }
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
