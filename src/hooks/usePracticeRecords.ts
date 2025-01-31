import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PracticeRecord {
  id: string;
  video_url: string;
  practice_date: string;
  mock_interview_questions: {
    title: string;
    mock_interview_bank_questions?: {
      title: string;
    }[];
  } | null;
}

export const usePracticeRecords = () => {
  const queryClient = useQueryClient();

  const { data: records, isLoading, refetch: refetchRecords } = useQuery({
    queryKey: ["practice-records"],
    queryFn: async () => {
      console.log("Fetching practice records...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log("No authenticated user found");
        return [];
      }

      const { data, error } = await supabase
        .from("interview_practice_records")
        .select(`
          id,
          video_url,
          practice_date,
          mock_interview_questions (
            title,
            mock_interview_bank_questions (
              title
            )
          )
        `)
        .eq('user_id', session.user.id)
        .order('practice_date', { ascending: false });

      if (error) {
        console.error("Error fetching practice records:", error);
        throw error;
      }

      console.log("Fetched practice records:", data);
      return data as PracticeRecord[];
    },
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const deleteRecord = useMutation({
    mutationFn: async (recordId: string) => {
      console.log("Deleting practice record:", recordId);
      const { error } = await supabase
        .from("interview_practice_records")
        .delete()
        .eq("id", recordId);

      if (error) {
        console.error("Error deleting practice record:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practice-records"] });
      toast.success("练习记录已删除");
    },
    onError: (error) => {
      console.error("Error in deleteRecord mutation:", error);
      toast.error("删除记录失败");
    },
  });

  return {
    records,
    isLoading,
    deleteRecord,
    refetchRecords
  };
};