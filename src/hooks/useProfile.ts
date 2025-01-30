import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Profile {
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
  user_type: string;
  graduation_school: string | null;
  background_intro: string | null;
  is_admin: boolean | null;
  application_year?: string | null;
}

interface RawProfile extends Omit<Profile, 'social_media'> {
  social_media: any;
}

const transformProfile = (rawProfile: RawProfile): Profile => {
  if (!rawProfile) return null;
  
  let socialMedia = null;
  try {
    if (rawProfile.social_media) {
      // If it's a string, try to parse it
      if (typeof rawProfile.social_media === 'string') {
        socialMedia = JSON.parse(rawProfile.social_media);
      } else {
        // If it's already an object, use it directly
        socialMedia = rawProfile.social_media;
      }
    }
  } catch (error) {
    console.error("Error parsing social_media:", error);
    socialMedia = null;
  }

  return {
    ...rawProfile,
    social_media: socialMedia
  };
};

export function useProfile() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      console.log("Fetching profile for user:", user.id);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setError(error.message);
        return null;
      }

      console.log("Profile data:", data);
      return data ? transformProfile(data as RawProfile) : null;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updatedProfile: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      console.log("Updating profile for user:", user.id, "with data:", updatedProfile);

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          user_type: 'student',
          ...updatedProfile
        })
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
      
      console.log("Profile updated successfully:", data);
      return transformProfile(data as RawProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      console.error("Mutation error:", error);
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