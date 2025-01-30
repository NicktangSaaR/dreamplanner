import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/profile";

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

      // Transform the social_media field to ensure type safety
      const transformedData: Profile = {
        ...data,
        social_media: data.social_media ? {
          linkedin: data.social_media.linkedin || "",
          twitter: data.social_media.twitter || "",
          instagram: data.social_media.instagram || "",
        } : null,
        interested_majors: Array.isArray(data.interested_majors) 
          ? data.interested_majors 
          : data.interested_majors?.split(',').map(m => m.trim()) || null
      };

      console.log("Profile data fetched:", transformedData);
      return transformedData;
    },
  });
};