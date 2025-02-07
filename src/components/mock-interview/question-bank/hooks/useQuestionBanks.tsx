
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Question } from "../types";
import { useState, useEffect } from "react";

export const useQuestionBanks = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.user_type === 'admin');
      }
    };
    getCurrentUser();
  }, []);

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

  return {
    questions,
    isLoading,
    refetch,
    currentUserId,
    isAdmin
  };
};
