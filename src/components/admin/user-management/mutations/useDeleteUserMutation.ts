
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
        // Get current session for authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error("Session error:", sessionError);
          throw new Error("Authentication required");
        }

        // Call the Edge Function to delete the user from auth.users
        const { data, error: deleteError } = await supabase.functions.invoke(
          'delete-user',
          {
            body: { userId },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            }
          }
        );

        if (deleteError) {
          console.error("Edge function error:", deleteError);
          throw deleteError;
        }

        console.log("Edge function response:", data);

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
      } catch (error: any) {
        console.error("Delete operation failed:", error);
        throw new Error(error?.message || "删除用户失败");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const userType = data.user_type === 'counselor' ? '辅导员' : '学生';
      toast.success(`${userType}${data.full_name ? ` ${data.full_name}` : ''} 已成功删除`);
    },
    onError: (error: Error) => {
      console.error("Error deleting user:", error);
      toast.error(error.message || "删除用户失败");
    },
  });
};
