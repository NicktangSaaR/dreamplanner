
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Handles invoking the Edge Function to send todo reminders
 */
const invokeReminderFunction = async (studentId: string) => {
  console.log("Invoking Edge Function with studentId:", studentId);
  
  return await supabase.functions.invoke('test-todo-reminders', {
    body: { 
      studentId, 
      debug: true,
      domain: "dreamplaneredu.com"
    }
  });
};

/**
 * Processes Edge Function invoke errors
 */
const handleInvokeError = (error: any): string => {
  console.error("Error sending reminder (invoke error):", error);
  console.error("Error details:", JSON.stringify(error));
  
  // Check for non-2xx errors
  if (typeof error === 'object' && error.message) {
    if (error.message.includes("Edge Function returned a non-2xx status code")) {
      // Provide additional suggestions
      setTimeout(() => {
        toast.error("可能原因：Resend API 密钥无效或域名未验证，请检查 Supabase Edge Function 密钥和日志");
      }, 1000);
      
      return "服务器错误：Edge Function 返回了错误状态码，请检查日志";
    }
  }
  
  return `发送提醒失败 (系统错误): ${JSON.stringify(error)}`;
};

/**
 * Processes domain verification errors
 */
const handleDomainVerificationError = (errorInfo: any): string => {
  if (errorInfo.code === "from_address_not_allowed" || 
      (errorInfo.message && errorInfo.message.includes("from_address_not_allowed")) ||
      (errorInfo.error && errorInfo.error.includes("from_address_not_allowed"))) {
    return `域名验证错误: dreamplaneredu.com 未在Resend.com验证。请前往Resend.com验证您的域名`;
  }
  return "";
};

/**
 * Processes API key related errors
 */
const handleApiKeyError = (errorInfo: any): string => {
  if (errorInfo.code === "unauthorized" || 
      (errorInfo.message && errorInfo.message.includes("unauthorized")) || 
      (errorInfo.error && errorInfo.error.includes("unauthorized")) ||
      (errorInfo.message && errorInfo.message.includes("API key"))) {
    return `API密钥错误: 请检查Supabase Edge Function配置中的Resend API密钥是否有效`;
  } else if (errorInfo.code === "invalid_api_key_format" || 
            (errorInfo.message && errorInfo.message.includes("Invalid API key format"))) {
    return `API密钥格式错误: Resend API密钥应以're_'开头，请检查设置`;
  } else if (errorInfo.code === "missing_api_key" || 
            (errorInfo.message && errorInfo.message.includes("missing"))) {
    return `缺少API密钥: RESEND_API_KEY 环境变量未设置，请在 Supabase Edge Function 密钥中设置`;
  }
  return "";
};

/**
 * Processes Edge Function response
 */
const processResponse = (data: any): { message: string, type: "success" | "error" | "warning" | "info" } => {
  // Handle errors returned by Edge Function
  if (data.error || (typeof data === 'string' && data.includes('error'))) {
    console.error("Edge Function returned an error:", data);
    
    // Try to parse error info
    let errorInfo = data;
    if (typeof data === 'string') {
      try {
        errorInfo = JSON.parse(data);
      } catch (e) {
        // If parsing fails, keep original
      }
    }
    
    // Check for specific error types
    const domainError = handleDomainVerificationError(errorInfo);
    if (domainError) return { message: domainError, type: "error" };
    
    const apiKeyError = handleApiKeyError(errorInfo);
    if (apiKeyError) return { message: apiKeyError, type: "error" };
    
    // Generic error message
    const errorMessage = errorInfo.message || errorInfo.error || JSON.stringify(errorInfo);
    return { message: `提醒发送失败: ${errorMessage}`, type: "error" };
  }
  
  // Handle warnings
  if (data.warning) {
    return { 
      message: `${data.warning}: 学生邮箱 (${data.studentEmail}), 辅导员邮箱 (${data.counselorEmail})`, 
      type: "warning" 
    };
  }
  
  // Handle success
  if (data.success) {
    const recipientInfo = data.sentTo ? `(发送给: ${data.sentTo.join(", ")})` : "";
    const message = `${data.message} ${recipientInfo}`;
    
    // Handle partial errors
    if (data.errors && data.errors.length > 0) {
      setTimeout(() => {
        toast.warning(`部分发送失败: ${data.errors.join("; ")}`);
      }, 1000);
    }
    
    return { message, type: "success" };
  } 
  
  // Handle empty todos case
  if (data.message === "No uncompleted todos to remind about") {
    return { message: "该学生没有未完成的待办事项", type: "info" };
  }
  
  // Fallback for unexpected responses
  return { 
    message: `操作完成，但返回了意外响应: ${JSON.stringify(data)}`, 
    type: "warning" 
  };
};

/**
 * Displays toast based on response type
 */
const showResponseToast = (response: { message: string, type: "success" | "error" | "warning" | "info" }, toastId?: string) => {
  if (toastId) {
    toast.dismiss(toastId);
  }
  
  switch (response.type) {
    case "success":
      toast.success(response.message);
      break;
    case "error":
      toast.error(response.message);
      break;
    case "warning":
      toast.warning(response.message);
      break;
    case "info":
      toast.info(response.message);
      break;
  }
};

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
      // Fixed: Convert the toast loading ID to string to ensure type safety
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
