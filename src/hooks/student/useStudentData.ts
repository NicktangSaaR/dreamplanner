import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/profile";
import { Json } from "@/integrations/supabase/types";

interface RawProfile extends Omit<Profile, 'social_media' | 'career_interest_test'> {
  social_media: Json;
  career_interest_test: Json;
}

const transformProfile = (rawProfile: RawProfile | null): Profile | null => {
  if (!rawProfile) return null;
  
  let socialMedia = null;
  try {
    if (rawProfile.social_media) {
      if (typeof rawProfile.social_media === 'string') {
        socialMedia = JSON.parse(rawProfile.social_media);
      } else {
        socialMedia = rawProfile.social_media as {
          linkedin?: string;
          twitter?: string;
          instagram?: string;
        };
      }
    }
  } catch (error) {
    console.error("Error parsing social_media:", error);
    socialMedia = null;
  }

  let careerTest = null;
  try {
    if (rawProfile.career_interest_test) {
      const rawTest = rawProfile.career_interest_test as any;
      careerTest = {
        completedAt: rawTest.completedAt,
        scores: rawTest.scores,
        primaryType: rawTest.primaryType
      };
    }
  } catch (error) {
    console.error("Error parsing career_interest_test:", error);
    careerTest = null;
  }

  return {
    ...rawProfile,
    social_media: socialMedia,
    career_interest_test: careerTest
  };
};

export const useStudentData = (studentId: string | undefined) => {
  // Profile query
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) {
        console.log("No student ID provided for profile query");
        return null;
      }
      
      console.log("Fetching profile for student:", studentId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      console.log("Raw student profile data:", data);
      const transformedProfile = transformProfile(data as RawProfile);
      console.log("Transformed student profile:", transformedProfile);
      
      return transformedProfile;
    },
    enabled: Boolean(studentId), // Only run query if studentId exists
  });

  // Courses query
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      if (!studentId) {
        console.log("No student ID provided for courses query");
        return [];
      }
      
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(studentId), // Only run query if studentId exists
  });

  // Activities query
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["student-activities", studentId],
    queryFn: async () => {
      if (!studentId) {
        console.log("No student ID provided for activities query");
        return [];
      }
      
      const { data, error } = await supabase
        .from("extracurricular_activities")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(studentId), // Only run query if studentId exists
  });

  // Notes query
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["student-notes", studentId],
    queryFn: async () => {
      if (!studentId) {
        console.log("No student ID provided for notes query");
        return [];
      }
      
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("author_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: Boolean(studentId), // Only run query if studentId exists
  });

  // Todos query
  const { data: todos = [], isLoading: isLoadingTodos } = useQuery({
    queryKey: ["student-todos", studentId],
    queryFn: async () => {
      if (!studentId) {
        console.log("No student ID provided for todos query");
        return [];
      }
      
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("author_id", studentId);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(studentId), // Only run query if studentId exists
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
