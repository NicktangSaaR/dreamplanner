import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  grade: string | null;
  school: string | null;
  interested_majors: string[] | null;
  social_media: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  } | null;
  personal_website: string | null;
}

export function useProfile() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        setError(error.message);
        return null;
      }
      return data as Profile;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updatedProfile: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updatedProfile)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update profile");
      setError(error.message);
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
}