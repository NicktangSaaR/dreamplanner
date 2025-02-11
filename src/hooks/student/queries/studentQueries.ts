
import { supabase } from "@/integrations/supabase/client";
import { transformProfile } from "../utils/profileTransformer";
import { checkCounselorAccess } from "../utils/counselorAccess";

export const fetchStudentProfile = async (studentId: string) => {
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
  const transformedProfile = transformProfile(data);
  console.log("Transformed student profile:", transformedProfile);
  
  return transformedProfile;
};

export const fetchStudentCourses = async (studentId: string) => {
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
};

export const fetchStudentActivities = async (studentId: string) => {
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
};

export const fetchStudentNotes = async (studentId: string) => {
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
};
