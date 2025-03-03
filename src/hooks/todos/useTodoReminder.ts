
// Ensure we're using the correct import paths and utility functions
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { processResponse } from './utils/responseProcessor';
import { toast } from 'sonner';

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
      const response = processResponse(data);
      
      // Show appropriate toast based on response type
      if (response.type === 'success') {
        toast.success(response.message);
      } else if (response.type === 'error') {
        toast.error(response.message);
      } else if (response.type === 'warning') {
        toast.warning(response.message);
      } else if (response.type === 'info') {
        toast.info(response.message);
      }
      
      return response;
    } catch (err) {
      console.error("Exception in sendReminder:", err);
      setConnectionError(true);
      // Directly handle the error here
      toast.error(`Reminder failed: ${err.message || 'Unknown error'}`);
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
