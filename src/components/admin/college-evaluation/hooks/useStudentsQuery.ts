
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Student {
  id: string;
  full_name: string;
  grade: string;
  school: string;
}

export const useStudentsQuery = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      console.log("Fetching student data for evaluation manager");
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, grade, school")
        .eq("user_type", "student");
      
      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
      console.log("Fetched students:", data);
      return data as Student[];
    },
    enabled: isAdmin, // Only run query if user is admin
  });
};
