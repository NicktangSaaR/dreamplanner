import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/hooks/useProfile";

interface RawProfile extends Omit<Profile, 'social_media'> {
  social_media: any;
}

const transformProfile = (rawProfile: RawProfile | null): Profile | null => {
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

export const useStudentData = (studentId: string | undefined) => {
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("No student ID provided");
      
      console.log("Fetching profile for student:", studentId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      console.log("Raw student profile data:", data);
      const transformedProfile = transformProfile(data as RawProfile);
      console.log("Transformed student profile:", transformedProfile);
      
      return transformedProfile;
    },
    enabled: !!studentId,
  });

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["student-activities", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("extracurricular_activities")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["student-notes", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("author_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const { data: todos = [], isLoading: isLoadingTodos } = useQuery({
    queryKey: ["student-todos", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("author_id", studentId);

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const isLoading = isLoadingProfile || isLoadingCourses || isLoadingActivities || isLoadingNotes || isLoadingTodos;

  return {
    profile,
    courses,
    activities,
    notes,
    todos,
    isLoading,
  };
};
