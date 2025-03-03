import { toast } from "sonner";
import { handleDomainVerificationError, handleApiKeyError } from "./errorHandlers";

/**
 * Processes Edge Function response
 */
export const processResponse = (data: any): { message: string, type: "success" | "error" | "warning" | "info" } => {
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
export const showResponseToast = (response: { message: string, type: "success" | "error" | "warning" | "info" }, toastId?: string) => {
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
