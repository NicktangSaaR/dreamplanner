
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { invokeReminderFunction } from "./services/todoReminderService";
import { handleInvokeError } from "./utils/errorHandlers";
import { processResponse, showResponseToast } from "./utils/responseProcessor";

/**
 * Custom hook to handle todo reminder functionality
 */
export const useTodoReminder = (studentId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const sendReminder = useCallback(async () => {
    if (!studentId) {
      console.error("No student ID provided");
      toast.error("无法发送提醒：未找到学生ID");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convert the toast loading ID to string to ensure type safety
      const toastId = toast.loading("发送提醒中...") as string;
      
      console.log("Invoking Edge Function with studentId:", studentId);
      
      // Invoke the Edge Function with better error debugging
      try {
        const result = await invokeReminderFunction(studentId);
        const { data, error } = result;
        
        console.log("Edge Function response:", data);
        console.log("Edge Function error:", error);
        
        // Handle invoke error
        if (error) {
          const errorMessage = handleInvokeError(error);
          toast.dismiss(toastId);
          toast.error(errorMessage);
          
          // Display detailed error info for debugging
          if (process.env.NODE_ENV !== 'production') {
            console.error("Detailed error information:", JSON.stringify(error, null, 2));
          }
          return;
        }
        
        // Handle no data
        if (!data) {
          toast.dismiss(toastId);
          toast.error("服务器返回了空响应，请检查 Edge Function 日志以获取详细信息");
          return;
        }
        
        // Process response and show toast
        const response = processResponse(data);
        showResponseToast(response, toastId);
      } catch (fetchError) {
        console.error("Fetch error when invoking Edge Function:", fetchError);
        toast.dismiss(toastId);
        toast.error(`无法连接到 Edge Function: ${JSON.stringify(fetchError)}`);
        
        // Display troubleshooting guidance
        setTimeout(() => {
          toast.error("请确保 Supabase 项目处于活动状态，并检查网络连接");
        }, 1000);
      }
    } catch (err: any) {
      console.error("Exception in send reminder:", err);
      console.error("Error details:", JSON.stringify(err));
      toast.dismiss();
      toast.error(`发送提醒失败 (应用错误): ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  return { sendReminder, isLoading };
};
