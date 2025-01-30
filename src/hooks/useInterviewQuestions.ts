import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Question, InterviewSettings } from '@/components/mock-interview/types';

export const useInterviewQuestions = (
  settings: InterviewSettings
) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionSequence, setQuestionSequence] = useState<any[]>([]);

  const initializeQuestions = useCallback(async () => {
    console.log('Initializing questions with settings:', settings);
    if (!settings.selectedQuestionId) return;

    try {
      const { data: bankQuestions, error } = await supabase
        .from('mock_interview_bank_questions')
        .select('*')
        .eq('bank_id', settings.selectedQuestionId);

      if (error) throw error;

      console.log('Fetched bank questions:', bankQuestions);

      if (!bankQuestions.length) return;

      let selectedQuestions = [...bankQuestions];
      
      if (settings.practiceMode === 'multiple') {
        // For multiple questions mode
        if (settings.questionOrder === 'random') {
          selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
        }
        
        selectedQuestions = selectedQuestions.slice(0, settings.numberOfQuestions);
      } else {
        // For single question mode, just take the first question
        selectedQuestions = [selectedQuestions[0]];
      }

      console.log('Selected questions sequence:', selectedQuestions);
      setQuestionSequence(selectedQuestions);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Error initializing questions:', error);
    }
  }, [settings]);

  const getCurrentQuestion = useCallback(() => {
    return questionSequence[currentQuestionIndex];
  }, [questionSequence, currentQuestionIndex]);

  const moveToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questionSequence.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentQuestionIndex, questionSequence.length]);

  const hasMoreQuestions = useCallback(() => {
    return currentQuestionIndex < questionSequence.length - 1;
  }, [currentQuestionIndex, questionSequence.length]);

  return {
    initializeQuestions,
    getCurrentQuestion,
    moveToNextQuestion,
    hasMoreQuestions,
    totalQuestions: questionSequence.length,
    currentQuestionNumber: currentQuestionIndex + 1
  };
};