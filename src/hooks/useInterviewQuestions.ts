import { useState, useCallback } from 'react';
import { Question, InterviewSettings } from '@/components/mock-interview/types';

export const useInterviewQuestions = (
  questions: Question[],
  settings: InterviewSettings
) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionSequence, setQuestionSequence] = useState<Question[]>([]);

  const initializeQuestions = useCallback(() => {
    console.log('Initializing questions with settings:', settings);
    if (!questions.length) return;

    let selectedQuestions: Question[] = [];
    
    if (settings.practiceMode === 'single') {
      const question = questions.find(q => q.id === settings.selectedQuestionId);
      if (question) {
        selectedQuestions = [question];
      }
    } else {
      // For multiple questions mode
      let availableQuestions = [...questions];
      
      // If random order is selected, shuffle the questions
      if (settings.questionOrder === 'random') {
        availableQuestions = availableQuestions
          .sort(() => Math.random() - 0.5);
      }
      
      selectedQuestions = availableQuestions
        .slice(0, settings.numberOfQuestions);
    }

    console.log('Selected questions sequence:', selectedQuestions);
    setQuestionSequence(selectedQuestions);
    setCurrentQuestionIndex(0);
  }, [questions, settings]);

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