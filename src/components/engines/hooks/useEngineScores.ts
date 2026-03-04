import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudentEngineScore } from "../types";
import { toast } from "sonner";

export const useEngineScores = (studentId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ["engine-scores", studentId],
    queryFn: async (): Promise<StudentEngineScore[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_engine_scores")
        .select("*")
        .eq("student_id", studentId)
        .order("evaluation_date", { ascending: false });
      if (error) throw error;
      return (data || []) as StudentEngineScore[];
    },
    enabled: !!studentId,
  });

  const createScore = useMutation({
    mutationFn: async (score: Partial<StudentEngineScore> & { student_id: string }) => {
      const { data, error } = await supabase
        .from("student_engine_scores")
        .insert(score)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engine-scores", studentId] });
      toast.success("评分已保存");
    },
    onError: (error: Error) => {
      toast.error(`保存失败: ${error.message}`);
    },
  });

  const updateScore = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StudentEngineScore> & { id: string }) => {
      const { data, error } = await supabase
        .from("student_engine_scores")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engine-scores", studentId] });
      toast.success("评分已更新");
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // Check for strategy alert: if score change > 2 from last evaluation
  const latestScore = scores[0];
  const previousScore = scores[1];
  const hasStrategyAlert = latestScore && previousScore && 
    Math.abs(latestScore.total_score - previousScore.total_score) > 2;

  return { scores, isLoading, createScore, updateScore, latestScore, hasStrategyAlert };
};
