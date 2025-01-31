import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUpdateUserDetailsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { 
      userId: string; 
      data: { full_name?: string; email?: string } 
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
};