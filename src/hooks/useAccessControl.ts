import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./useProfile";

export function useAccessControl(studentId: string | undefined, profile: Profile | null) {
  const { data: hasAccess, isLoading: checkingAccess } = useQuery({
    queryKey: ["check-student-access", studentId, profile?.id],
    queryFn: async () => {
      if (!profile?.id || !studentId) return false;
      
      console.log("Checking access rights for student dashboard");
      
      if (profile.id === studentId) {
        console.log("Student accessing own dashboard");
        return true;
      }
      
      if (profile.user_type === 'counselor') {
        const { data, error } = await supabase
          .from("counselor_student_relationships")
          .select("*")
          .eq("counselor_id", profile.id)
          .eq("student_id", studentId)
          .maybeSingle();

        if (error) {
          console.error("Error checking counselor relationship:", error);
          return false;
        }

        console.log("Counselor relationship check result:", data);
        return !!data;
      }

      return false;
    },
    enabled: !!profile?.id && !!studentId,
  });

  return { hasAccess, checkingAccess };
}