import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/profile";
import { Json } from "@/integrations/supabase/types";

export const useProfileQuery = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      console.log("Fetching profile data...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No authenticated user found");
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      // Type assertion for social_media as it comes from JSON column
      const socialMedia = data.social_media as { 
        linkedin?: string; 
        twitter?: string; 
        instagram?: string; 
      } | null;

      // Handle interested_majors with proper type checking
      let interestedMajors: string[] | null = null;
      if (data.interested_majors) {
        if (Array.isArray(data.interested_majors)) {
          interestedMajors = data.interested_majors;
        } else if (typeof data.interested_majors === 'string') {
          interestedMajors = data.interested_majors.split(',').map(m => m.trim());
        }
      }

      // Transform the data with proper type handling
      const transformedData: Profile = {
        ...data,
        social_media: socialMedia ? {
          linkedin: socialMedia.linkedin || "",
          twitter: socialMedia.twitter || "",
          instagram: socialMedia.instagram || "",
        } : null,
        interested_majors: interestedMajors
      };

      console.log("Profile data fetched:", transformedData);
      return transformedData;
    },
  });
};