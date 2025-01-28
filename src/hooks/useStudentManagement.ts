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
      console.log("Adding student relationship:", { counselorId, studentId });
      
      const { error } = await supabase
        .from("counselor_student_relationships")
        .insert([{ counselor_id: counselorId, student_id: studentId }]);

      if (error) {
        console.error("Error adding student:", error);
        throw error;
      }

      toast.success("Student added successfully");
      return true;
    } catch (error) {
      console.error("Error in addStudent:", error);
      toast.error("Failed to add student");
      return false;
    }
  };

  return {
    isLoading,
    searchStudent,
    addStudent,
  };
}