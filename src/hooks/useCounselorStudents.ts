import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StudentProfile {
  id: string;
  full_name: string | null;
  grade: string | null;
  school: string | null;
}

interface CounselorStudentRelationship {
  student_id: string;
  students: StudentProfile | null;
}

export function useCounselorStudents() {
  return useQuery({
    queryKey: ["counselor-students"],
    queryFn: async () => {
      console.log("Fetching counselor's students");
      
      const { data: relationships, error: relationshipsError } = await supabase
        .from("counselor_student_relationships")
        .select(`
          student_id,
          students:profiles!inner(
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
      return relationships as CounselorStudentRelationship[];
    },
  });
}