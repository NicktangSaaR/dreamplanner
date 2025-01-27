import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCounselorStudents() {
  return useQuery({
    queryKey: ["counselor-students"],
    queryFn: async () => {
      console.log("Fetching counselor's students");
      
      const { data: relationships, error: relationshipsError } = await supabase
        .from("counselor_student_relationships")
        .select(`
          student_id,
          students:profiles(
            id,
            full_name,
            grade,
            school
          )
        `)
        .eq('counselor_id', (await supabase.auth.getUser()).data.user?.id);

      if (relationshipsError) {
        console.error("Error fetching relationships:", relationshipsError);
        throw relationshipsError;
      }

      console.log("Fetched relationships:", relationships);
      return relationships;
    },
  });
}