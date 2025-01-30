import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SocialMedia {
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  [key: string]: string | undefined; // Add index signature
}

export interface Profile {
  id: string;
  user_type: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  grade: string | null;
  school: string | null;
  interested_majors: string[] | null;
  social_media: SocialMedia | null;
  personal_website: string | null;
  graduation_school: string | null;
  background_intro: string | null;
  is_admin: boolean | null;
  application_year?: string | null;
}

interface RawProfile extends Omit<Profile, 'social_media'> {
  social_media: any;
}

const transformProfile = (rawProfile: RawProfile | null): Profile | null => {
  if (!rawProfile) return null;
  
  let socialMedia: SocialMedia | null = null;
  try {
    if (rawProfile.social_media) {
      if (typeof rawProfile.social_media === 'string') {
        socialMedia = JSON.parse(rawProfile.social_media);
      } else {
        socialMedia = rawProfile.social_media as SocialMedia;
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

export function useProfile(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");
      
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      console.log("Raw profile data:", data);
      const transformedProfile = transformProfile(data);
      console.log("Transformed profile:", transformedProfile);
      
      return transformedProfile;
    },
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!userId) throw new Error("No user ID provided");

      // Convert social_media to a plain object before sending to Supabase
      const updatesForDb = {
        ...updates,
        social_media: updates.social_media ? { ...updates.social_media } : null
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(updatesForDb)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return transformProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    updateProfile: mutation
  };
}