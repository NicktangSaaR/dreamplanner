import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log("Deleting user:", userId);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success("用户已成功删除");
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast.error("删除用户失败");
    },
  });

  const updateUserTypeMutation = useMutation({
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

  const updateUserDetailsMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { full_name?: string; email?: string } }) => {
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
              const response = await fetch('/functions/v1/update-user-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.data.session?.access_token}`,
                },
                body: JSON.stringify({
                  userId,
                  newEmail: data.email,
                }),
              });
              
              const result = await response.json();
              if (!response.ok) {
                reject(new Error(result.error));
              } else {
                resolve();
              }
            } catch (error) {
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
    onError: (error) => {
      console.error("Error updating user details:", error);
      toast.error("更新用户信息失败");
    },
  });

  return {
    deleteUserMutation,
    updateUserTypeMutation,
    updateUserDetailsMutation,
  };
};