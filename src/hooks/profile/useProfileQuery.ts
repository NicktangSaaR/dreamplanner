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
      const rawMajors = data.interested_majors as string[] | string | null;

      if (rawMajors) {
        if (Array.isArray(rawMajors)) {
          interestedMajors = rawMajors;
        } else if (typeof rawMajors === 'string') {
          interestedMajors = rawMajors.split(',').map(m => m.trim());
        }
      }

      // Handle career_interest_test data
      let careerInterestTest = null;
      if (data.career_interest_test) {
        const rawTest = data.career_interest_test as Json;
        if (typeof rawTest === 'object' && rawTest !== null) {
          careerInterestTest = {
            completedAt: (rawTest as any).completedAt,
            scores: (rawTest as any).scores,
            primaryType: (rawTest as any).primaryType,
          };
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
        interested_majors: interestedMajors,
        career_interest_test: careerInterestTest
      };

      console.log("Profile data fetched:", transformedData);
      return transformedData;
    },
  });
};