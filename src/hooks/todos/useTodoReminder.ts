
// Ensure we're using the correct import paths and utility functions
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { processResponse } from './utils/responseProcessor';
import { handleInvokeError } from './utils/errorHandlers';
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
      
      // Use a timeout to prevent the request from hanging indefinitely
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000);
      });
      
      // The actual request to the Edge Function
      const edgeFunctionPromise = supabase.functions.invoke('test-todo-reminders', {
        body: { studentId }
      });
      
      // Race the timeout against the actual request
      const { data, error } = await Promise.race([
        edgeFunctionPromise,
        timeoutPromise.then(() => {
          throw { isConnectionError: true, message: "Connection timed out" };
        })
      ]) as any;
      
      console.log("Reminder response:", data);
      
      if (error) {
        console.error("Error from reminder function:", error);
        setConnectionError(true);
        throw error;
      }
      
      if (data?.error) {
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
      
      // Use the specialized error handler for invoke errors
      if (err.name === "FunctionsFetchError" || err.isConnectionError) {
        const errorMessage = handleInvokeError(err);
        toast.error(errorMessage);
      } else {
        // Handle other types of errors
        toast.error(`提醒失败: ${err.message || '未知错误'}`);
      }
      
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
