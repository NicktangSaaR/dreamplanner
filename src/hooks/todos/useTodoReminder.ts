
// Ensure we're using the correct import paths and utility functions
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { processResponse, handleError } from './utils/responseProcessor';

export const useTodoReminder = (studentId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null);

  const sendReminder = useCallback(async () => {
    if (!studentId) {
      throw new Error('No student ID provided');
    }

    setIsLoading(true);
    setLastAttempt(new Date());
    
    try {
      console.log(`Sending reminder for student: ${studentId}`);
      
      const { data, error } = await supabase.functions.invoke('test-todo-reminders', {
        body: { studentId }
      });
      
      console.log("Reminder response:", data);
      
      if (error) {
        console.error("Error from reminder function:", error);
        setConnectionError(true);
        throw new Error(`Function error: ${error.message}`);
      }
      
      if (data.error) {
        console.error("API error:", data.error, data.details);
        setConnectionError(true);
        throw new Error(data.error);
      }
      
      setConnectionError(false);
      return processResponse(data);
    } catch (err) {
      console.error("Exception in sendReminder:", err);
      setConnectionError(true);
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  return {
    sendReminder,
    isLoading,
    connectionError,
    lastAttempt
  };
};
