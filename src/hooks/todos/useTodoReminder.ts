
import { useCallback } from "react";
import { toast } from "sonner";
import { invokeReminderFunction } from "./services/todoReminderService";
import { handleInvokeError } from "./utils/errorHandlers";
import { processResponse, showResponseToast } from "./utils/responseProcessor";

/**
 * Custom hook to handle todo reminder functionality
 */
export const useTodoReminder = (studentId: string | undefined) => {
  const sendReminder = useCallback(async () => {
    if (!studentId) {
      console.error("No student ID provided");
      toast.error("无法发送提醒：未找到学生ID");
      return;
    }
    
    try {
      // Convert the toast loading ID to string to ensure type safety
      const toastId = toast.loading("发送提醒中...") as string;
      
      // Invoke the Edge Function
      const result = await invokeReminderFunction(studentId);
      const { data, error } = result;
      
      console.log("Edge Function response:", data);
      console.log("Edge Function error:", error);
      
      // Handle invoke error
      if (error) {
        const errorMessage = handleInvokeError(error);
        toast.dismiss(toastId);
        toast.error(errorMessage);
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
      
    } catch (err: any) {
      console.error("Exception in send reminder:", err);
      console.error("Error details:", JSON.stringify(err));
      toast.dismiss();
      toast.error(`发送提醒失败 (应用错误): ${err.message || JSON.stringify(err)}`);
    }
  }, [studentId]);

  return { sendReminder };
};
