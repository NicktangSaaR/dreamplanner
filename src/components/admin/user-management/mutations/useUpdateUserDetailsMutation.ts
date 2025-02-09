
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
      
      const updates: Array<Promise<void>> = [];

      if (data.full_name) {
        updates.push(
          new Promise<void>((resolve, reject) => {
            supabase
              .from('profiles')
              .update({ full_name: data.full_name })
              .eq('id', userId)
              .then(({ error }) => {
                if (error) reject(error);
                else resolve();
              });
          })
        );
      }

      if (data.email) {
        updates.push(
          new Promise<void>(async (resolve, reject) => {
            try {
              const session = await supabase.auth.getSession();
              if (!session.data.session?.access_token) {
                throw new Error('Not authenticated');
              }

              const response = await fetch('/functions/v1/update-user-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.data.session.access_token}`,
                },
                body: JSON.stringify({
                  userId,
                  newEmail: data.email,
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(errorData.error || 'Failed to update email');
              }
              
              const result = await response.json();
              if (result.error) {
                throw new Error(result.error);
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
              const session = await supabase.auth.getSession();
              if (!session.data.session?.access_token) {
                throw new Error('Not authenticated');
              }

              const response = await fetch('/functions/v1/update-user-password', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.data.session.access_token}`,
                },
                body: JSON.stringify({
                  userId,
                  newPassword: data.password,
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(errorData.error || 'Failed to update password');
              }
              
              const result = await response.json();
              if (result.error) {
                throw new Error(result.error);
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
      toast.success("用户信息已更新");
    },
    onError: (error: Error) => {
      console.error("Error updating user details:", error);
      toast.error(`更新用户信息失败: ${error.message}`);
    },
  });
};
