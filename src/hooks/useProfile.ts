import { useProfileQuery } from "./profile/useProfileQuery";
import { Profile, ProfileError } from "@/types/profile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProfile = () => {
  const queryClient = useQueryClient();
  const { 
    data: profile, 
    isLoading,
    error,
  } = useProfileQuery();

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      console.log("Updating profile with:", updates);
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile?.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }

      console.log("Profile updated successfully:", data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error in updateProfile mutation:", error);
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  return {
    profile: profile as Profile | null,
    isLoading,
    error: error as ProfileError | null,
    updateProfile,
  };
};

export type { Profile, ProfileError };