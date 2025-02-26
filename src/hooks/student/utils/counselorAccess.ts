
import { supabase } from "@/integrations/supabase/client";

export const checkCounselorAccess = async (studentId: string, counselorId: string) => {
  try {
    // Check if counselor has access through primary relationship
    const { data: primaryRelation, error: primaryError } = await supabase
      .from("counselor_student_relationships")
      .select()
      .eq('counselor_id', counselorId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (primaryError) {
      console.error("Error checking primary relationship:", primaryError);
      return false;
    }

    if (primaryRelation) return true;

    // Check if counselor has access through collaboration
    const { data: collaboration, error: collabError } = await supabase
      .from("counselor_collaborations")
      .select()
      .eq('collaborator_id', counselorId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (collabError) {
      console.error("Error checking collaboration:", collabError);
      return false;
    }

    return !!collaboration;
  } catch (error) {
    console.error("Error checking counselor access:", error);
    return false;
  }
};

