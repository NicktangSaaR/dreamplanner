
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUpdateUserDetailsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { 
      userId: string; 
      data: { 
        full_name?: string; 
        email?: string;
        password?: string;
      } 
    }) => {
      console.log("Updating user details:", userId, data);
      
      // First, ensure we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Session error:", sessionError);
        throw new Error('Not authenticated or session expired. Please log in again.');
      }

      const updates = [];

      // Update full name in profiles table
      if (data.full_name) {
        updates.push(
          supabase
            .from('profiles')
            .update({ 
              full_name: data.full_name,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .then(({ error, data }) => {
              if (error) {
                console.error("Error updating full name:", error);
                throw new Error(`Failed to update full name: ${error.message}`);
              }
              return data;
            })
        );
      }

      // Update email using edge function
      if (data.email) {
        updates.push(
          supabase.functions.invoke('update-user-email', {
            body: {
              userId,
              newEmail: data.email,
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }).then(({ error, data }) => {
            if (error) {
              console.error('Email update error:', error);
              throw new Error(error.message || 'Failed to update email');
            }
            return data;
          })
        );
      }

      // Update password using edge function
      if (data.password) {
        updates.push(
          supabase.functions.invoke('update-user-password', {
            body: {
              userId,
              newPassword: data.password,
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }).then(({ error, data }) => {
            if (error) {
              console.error('Password update error:', error);
              throw new Error(error.message || 'Failed to update password');
            }
            return data;
          })
        );
      }

      // Wait for all updates to complete
      try {
        const results = await Promise.all(updates);
        console.log("Update results:", results);
        return results;
      } catch (error) {
        console.error("Error in updates:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success("用户信息已更新");
    },
    onError: (error: Error) => {
      console.error("Error updating user details:", error);
      toast.error(`更新用户信息失败: ${error.message}`);
    },
  });
};
