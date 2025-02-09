
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

      const updates: Array<Promise<void>> = [];

      if (data.full_name) {
        updates.push(
          new Promise<void>((resolve, reject) => {
            supabase
              .from('profiles')
              .update({ full_name: data.full_name })
              .eq('id', userId)
              .then(({ error }) => {
                if (error) {
                  console.error("Error updating full name:", error);
                  reject(new Error(`Failed to update full name: ${error.message}`));
                } else {
                  resolve();
                }
              });
          })
        );
      }

      if (data.email) {
        updates.push(
          new Promise<void>(async (resolve, reject) => {
            try {
              const response = await supabase.functions.invoke('update-user-email', {
                body: {
                  userId,
                  newEmail: data.email,
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });
              
              if (response.error) {
                console.error('Email update error:', response.error);
                throw new Error(response.error.message || 'Failed to update email');
              }
              
              resolve();
            } catch (error) {
              console.error('Email update error:', error);
              reject(error);
            }
          })
        );
      }

      if (data.password) {
        updates.push(
          new Promise<void>(async (resolve, reject) => {
            try {
              const response = await supabase.functions.invoke('update-user-password', {
                body: {
                  userId,
                  newPassword: data.password,
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });
              
              if (response.error) {
                console.error('Password update error:', response.error);
                throw new Error(response.error.message || 'Failed to update password');
              }
              
              resolve();
            } catch (error) {
              console.error('Password update error:', error);
              reject(error);
            }
          })
        );
      }

      await Promise.all(updates);
    },
    onSuccess: () => {
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
