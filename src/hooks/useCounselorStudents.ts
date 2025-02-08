
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StudentProfile {
  id: string;
  full_name: string | null;
  grade: string | null;
  school: string | null;
  interested_majors: string[] | null;
}

interface CounselorStudentRelationship {
  student_id: string;
  students: StudentProfile;
}

export function useCounselorStudents() {
  return useQuery({
    queryKey: ["counselor-students"],
    queryFn: async () => {
      console.log("Fetching counselor's students");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Fetch primary relationships
      const { data: primaryRelationships, error: primaryError } = await supabase
        .from("counselor_student_relationships")
        .select(`
          student_id,
          students:profiles!counselor_student_relationships_student_profiles_fkey(
            id,
            full_name,
            grade,
            school,
            interested_majors
          )
        `)
        .eq('counselor_id', user.id);

      if (primaryError) {
        console.error("Error fetching primary relationships:", primaryError);
        throw primaryError;
      }

      // Fetch collaborations
      const { data: collaborations, error: collaborationsError } = await supabase
        .from("counselor_collaborations")
        .select(`
          student_id,
          students:profiles(
            id,
            full_name,
            grade,
            school,
            interested_majors
          )
        `)
        .eq('collaborator_id', user.id);

      if (collaborationsError) {
        console.error("Error fetching collaborations:", collaborationsError);
        throw collaborationsError;
      }

      // Combine both sets of relationships
      const allRelationships = [
        ...(primaryRelationships || []),
        ...(collaborations || [])
      ];

      // Remove duplicates based on student_id
      const uniqueRelationships = Array.from(
        new Map(allRelationships.map(item => [item.student_id, item])).values()
      );

      console.log("All student relationships:", uniqueRelationships);
      return uniqueRelationships as CounselorStudentRelationship[];
    },
  });
}
