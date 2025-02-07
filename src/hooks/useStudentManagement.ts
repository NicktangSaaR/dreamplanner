
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StudentSearchResult } from "@/components/college-planning/types/student-management";

export function useStudentManagement(counselorId: string) {
  const [isLoading, setIsLoading] = useState(false);

  const searchStudent = async (email: string): Promise<StudentSearchResult> => {
    try {
      console.log("Searching for student with email:", email);
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Error searching for student:", error);
        return { user: null, error: "No user found with this email" };
      }

      if (profile.user_type !== 'student') {
        return { user: null, error: "The specified email belongs to a non-student user" };
      }

      return { user: { id: profile.id, email, user_metadata: { full_name: profile.full_name } } };
    } catch (error) {
      console.error("Error in searchStudent:", error);
      return { user: null, error: "An unexpected error occurred" };
    }
  };

  const addStudent = async (studentId: string) => {
    try {
      setIsLoading(true);
      console.log("Adding student relationship:", { counselorId, studentId });

      // First verify that the current user is a counselor
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", counselorId)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching counselor profile:", profileError);
        toast.error("Failed to verify counselor status");
        return false;
      }

      if (profile.user_type !== 'counselor') {
        console.error("User is not a counselor");
        toast.error("Only counselors can add students");
        return false;
      }

      // Then create the relationship
      const { error } = await supabase
        .from("counselor_student_relationships")
        .insert([{ 
          counselor_id: counselorId, 
          student_id: studentId 
        }]);

      if (error) {
        console.error("Error adding student:", error);
        toast.error("Failed to add student");
        return false;
      }

      toast.success("Student added successfully");
      return true;
    } catch (error) {
      console.error("Error in addStudent:", error);
      toast.error("Failed to add student");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    searchStudent,
    addStudent,
  };
}
