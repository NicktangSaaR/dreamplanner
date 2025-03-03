
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { invokeReminderFunction, checkSupabaseConnectivity } from "./services/todoReminderService";
import { handleInvokeError } from "./utils/errorHandlers";
import { processResponse, showResponseToast } from "./utils/responseProcessor";

/**
 * Custom hook to handle todo reminder functionality
 */
export const useTodoReminder = (studentId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const sendReminder = useCallback(async () => {
    if (!studentId) {
      console.error("No student ID provided");
      toast.error("无法发送提醒：未找到学生ID");
      return;
    }
    
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      // Convert the toast loading ID to string to ensure type safety
      const toastId = toast.loading("发送提醒中...") as string;
      
      console.log("Invoking Edge Function with studentId:", studentId);
      
      // Check connectivity first
      const isConnected = await checkSupabaseConnectivity();
      if (!isConnected) {
        toast.dismiss(toastId);
        const errorMessage = "Supabase 项目可能处于休眠状态，请访问 Supabase 控制台激活项目后重试";
        toast.error(errorMessage);
        setConnectionError(errorMessage);
        setIsLoading(false);
        return;
      }
      
      // Invoke the Edge Function with better error debugging
      try {
        const result = await invokeReminderFunction(studentId);
        const { data, error } = result;
        
        console.log("Edge Function response:", data);
        console.log("Edge Function error:", error);
        
        // Handle connection error
        if (error && error.isConnectionError) {
          toast.dismiss(toastId);
          const errorMessage = error.message || "无法连接到 Edge Function，请检查 Supabase 项目状态";
          toast.error(errorMessage, {
            description: "请尝试访问 Supabase 控制台以激活项目，然后重试",
            duration: 5000
          });
          setConnectionError(errorMessage);
          return;
        }
        
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
        
        const errorMessage = "无法连接到 Edge Function，可能原因: 1) Supabase 项目休眠 2) 网络连接问题 3) Edge Function 部署问题";
        toast.error(errorMessage, {
          description: "请尝试访问 Supabase 控制台以激活项目，然后重试",
          duration: 5000
        });
        
        setConnectionError(errorMessage);
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

  return { sendReminder, isLoading, connectionError };
};
