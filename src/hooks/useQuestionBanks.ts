
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Question } from "@/components/mock-interview/types";
import { toast } from "sonner";

export const useQuestionBanks = (currentUserId: string | null, isAdmin: boolean) => {
  const { data: questions = [], isLoading, refetch } = useQuery({
    queryKey: ['interview-questions'],
    queryFn: async () => {
      console.log("Fetching question banks...");
      const { data, error } = await supabase
        .from('mock_interview_questions')
        .select(`
          id,
          title,
          description,
          preparation_time,
          response_time,
          is_system,
          created_by,
          mock_interview_bank_questions (
            id,
            title,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching question banks:", error);
        throw error;
      }

      const filteredData = data.filter(q => 
        q.is_system || 
        q.created_by === currentUserId ||
        isAdmin
      );

      console.log("Fetched question banks:", filteredData);
      return filteredData as Question[];
    },
    enabled: !!currentUserId,
  });

  const handleDelete = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to delete this question bank?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mock_interview_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast.success("Question bank deleted successfully");
      refetch();
      return true;
    } catch (error) {
      console.error("Error deleting question bank:", error);
      toast.error("Failed to delete question bank");
      return false;
    }
  };

  const systemQuestions = questions.filter(q => q.is_system);
  const customQuestions = questions.filter(q => !q.is_system);

  return {
    questions,
    systemQuestions,
    customQuestions,
    isLoading,
    refetch,
    handleDelete
  };
};
