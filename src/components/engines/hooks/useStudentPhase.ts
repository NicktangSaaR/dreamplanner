import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudentPhase } from "../types";
import { toast } from "sonner";

export const useStudentPhase = (studentId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: phase, isLoading } = useQuery({
    queryKey: ["student-phase", studentId],
    queryFn: async (): Promise<StudentPhase | null> => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("student_phases")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();
      if (error) throw error;
      return data as StudentPhase | null;
    },
    enabled: !!studentId,
  });

  const upsertPhase = useMutation({
    mutationFn: async (updates: Partial<StudentPhase> & { student_id: string }) => {
      const { data: existing } = await supabase
        .from("student_phases")
        .select("id")
        .eq("student_id", updates.student_id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("student_phases")
          .update(updates)
          .eq("student_id", updates.student_id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("student_phases")
          .insert(updates)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-phase", studentId] });
      toast.success("阶段信息已更新");
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  return { phase, isLoading, upsertPhase };
};
