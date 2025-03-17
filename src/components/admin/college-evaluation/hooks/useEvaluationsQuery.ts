
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudentEvaluation } from "../types";

export const useEvaluationsQuery = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ["student-evaluations"],
    queryFn: async () => {
      console.log("Fetching evaluation data");
      const { data, error } = await supabase
        .from("student_evaluations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching evaluations:", error);
        throw error;
      }
      console.log("Fetched evaluations with university types:", data);
      return data as StudentEvaluation[];
    },
    enabled: isAdmin, // Only run query if user is admin
  });
};
