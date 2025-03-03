
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
    return { data: null, error };
  }
};
