
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles invoking the Edge Function to send todo reminders
 */
export const invokeReminderFunction = async (studentId: string) => {
  console.log("Preparing to invoke Edge Function with studentId:", studentId);
  
  // Add timestamp to help correlate logs
  const timestamp = new Date().toISOString();
  console.log(`Request timestamp: ${timestamp}`);
  
  try {
    // Check if supabase client is initialized properly
    if (!supabase || !supabase.functions) {
      console.error("Supabase client or functions not properly initialized");
      return { data: null, error: "Supabase client initialization error" };
    }
    
    // Check project connectivity before attempting to invoke the function
    try {
      // Simple ping to check Supabase connectivity
      const { data: pingData, error: pingError } = await supabase.from('todos').select('count').limit(1);
      if (pingError) {
        console.warn("Supabase connectivity check failed:", pingError);
        return { 
          data: null, 
          error: {
            name: "SupabaseConnectionError",
            message: "Cannot connect to Supabase project. The project may be in sleep mode or there may be network connectivity issues.",
            isConnectionError: true
          }
        };
      }
      console.log("Supabase connectivity check successful");
    } catch (pingError) {
      console.error("Exception during connectivity check:", pingError);
    }
    
    // Now attempt to invoke the Edge Function
    console.log("Invoking Edge Function with parameters:", { studentId, debug: true, domain: "dreamplaneredu.com" });
    
    const response = await supabase.functions.invoke('test-todo-reminders', {
      body: { 
        studentId, 
        debug: true,
        domain: "dreamplaneredu.com",
        timestamp
      }
    });
    
    console.log(`Edge Function response received at ${new Date().toISOString()}`);
    return response;
  } catch (error) {
    console.error("Error in invokeReminderFunction:", error);
    
    // Enhance error object with additional information for better user feedback
    if (error.name === "FunctionsFetchError" || (error.message && error.message.includes("Failed to fetch"))) {
      return { 
        data: null, 
        error: {
          name: "FunctionsFetchError",
          message: "Failed to connect to Edge Function. The function may not be deployed, the project may be in sleep mode, or there may be network connectivity issues.",
          originalError: error,
          isConnectionError: true
        }
      };
    }
    
    return { data: null, error };
  }
};

/**
 * Utility function to check if Supabase project is online
 */
export const checkSupabaseConnectivity = async () => {
  try {
    // Use a simple query to check if Supabase is responsive
    const { data, error } = await supabase.from('todos').select('count').limit(1);
    return !error;
  } catch (e) {
    console.error("Error checking Supabase connectivity:", e);
    return false;
  }
};
