
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles invoking the Edge Function to send todo reminders
 */
export const invokeReminderFunction = async (studentId: string) => {
  console.log("Invoking Edge Function with studentId:", studentId);
  
  return await supabase.functions.invoke('test-todo-reminders', {
    body: { 
      studentId, 
      debug: true,
      domain: "dreamplaneredu.com"
    }
  });
};
