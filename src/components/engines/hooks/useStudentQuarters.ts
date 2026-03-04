import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudentQuarter } from "../types";
import { toast } from "sonner";

export const useStudentQuarters = (studentId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: quarters = [], isLoading } = useQuery({
    queryKey: ["student-quarters", studentId],
    queryFn: async (): Promise<StudentQuarter[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_quarters")
        .select("*")
        .eq("student_id", studentId)
        .order("academic_year", { ascending: false })
        .order("quarter");
      if (error) throw error;
      return (data || []) as StudentQuarter[];
    },
    enabled: !!studentId,
  });

  const upsertQuarter = useMutation({
    mutationFn: async (updates: Record<string, any> & { student_id: string; quarter: string; academic_year: string }) => {
      const { data: existing } = await supabase
        .from("student_quarters")
        .select("id")
        .eq("student_id", updates.student_id)
        .eq("quarter", updates.quarter)
        .eq("academic_year", updates.academic_year)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("student_quarters")
          .update(updates)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("student_quarters")
          .insert(updates)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-quarters", studentId] });
      toast.success("季度信息已更新");
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  return { quarters, isLoading, upsertQuarter };
};
