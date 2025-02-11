
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/hooks/useProfile";

interface RawProfile extends Omit<Profile, 'social_media' | 'career_interest_test'> {
  social_media: any;
  career_interest_test: any;
}

const transformProfile = (rawProfile: RawProfile | null): Profile | null => {
  if (!rawProfile) return null;
  
  let socialMedia = null;
  try {
    if (rawProfile.social_media) {
      if (typeof rawProfile.social_media === 'string') {
        socialMedia = JSON.parse(rawProfile.social_media);
      } else {
        socialMedia = rawProfile.social_media;
      }
    }
  } catch (error) {
    console.error("Error parsing social_media:", error);
    socialMedia = null;
  }

  let careerInterestTest = null;
  try {
    if (rawProfile.career_interest_test) {
      if (typeof rawProfile.career_interest_test === 'string') {
        careerInterestTest = JSON.parse(rawProfile.career_interest_test);
      } else {
        careerInterestTest = rawProfile.career_interest_test;
      }
    }
  } catch (error) {
    console.error("Error parsing career_interest_test:", error);
    careerInterestTest = null;
  }

  return {
    ...rawProfile,
    social_media: socialMedia,
    career_interest_test: careerInterestTest
  };
};

const checkCounselorAccess = async (studentId: string, counselorId: string) => {
  // Check if counselor has access through primary relationship
  const { data: primaryRelation, error: primaryError } = await supabase
    .from("counselor_student_relationships")
    .select()
    .eq('counselor_id', counselorId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (primaryError) {
    console.error("Error checking primary relationship:", primaryError);
    return false;
  }

  if (primaryRelation) return true;

  // Check if counselor has access through collaboration
  const { data: collaboration, error: collabError } = await supabase
    .from("counselor_collaborations")
    .select()
    .eq('collaborator_id', counselorId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (collabError) {
    console.error("Error checking collaboration:", collabError);
    return false;
  }

  return !!collaboration;
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user");
        return null;
      }

      // Verify counselor access
      const hasAccess = await checkCounselorAccess(studentId, user.id);
      if (!hasAccess) {
        console.log("Counselor does not have access to this student");
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
    enabled: Boolean(studentId),
  });

  // Courses query with better logging
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      if (!studentId) {
        console.log("No student ID provided for courses query");
        return [];
      }
      
      console.log("Fetching courses for student:", studentId);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("student_id", studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching courses:", error);
        throw error;
      }

      console.log("Fetched courses:", data);
      return data;
    },
    enabled: Boolean(studentId),
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
        .eq("student_id", studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: Boolean(studentId),
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
    enabled: Boolean(studentId),
  });

  const isLoading = isLoadingProfile || isLoadingCourses || isLoadingActivities || isLoadingNotes;

  return {
    profile,
    courses,
    activities,
    notes,
    isLoading,
  };
};
