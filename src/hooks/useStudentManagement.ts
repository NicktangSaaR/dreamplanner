
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StudentSearchResult } from "@/components/college-planning/types/student-management";
import { User } from "@supabase/supabase-js";

export function useStudentManagement(counselorId: string) {
  const [isLoading, setIsLoading] = useState(false);

  const searchStudent = async (email: string): Promise<StudentSearchResult> => {
    try {
      console.log("Searching for student with email:", email);
      
      const { data: users, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });

      if (error) {
        console.error("Error fetching users:", error);
        return { user: null, error: "Failed to search for user" };
      }

      const matchingUser = users.users.find((user: User) => user.email === email);
      if (!matchingUser) {
        return { user: null, error: "No user found with this email" };
      }

      return { user: matchingUser };
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

      // Check if student already has a counselor
      const { data: existingRelationship, error: checkError } = await supabase
        .from("counselor_student_relationships")
        .select("counselor_id")
        .eq("student_id", studentId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing relationship:", checkError);
        toast.error("Failed to check existing relationship");
        return false;
      }

      if (existingRelationship) {
        toast.error("This student already has a counselor assigned");
        return false;
      }

      // Create the relationship
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
