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
    console.error("Reminder failed:", errorInfo);
    return { message: "提醒邮件没能发出，请稍后再试。如果一直不行，请联系网站管理员。", type: "error" };
  }
  
  // Handle warnings
  if (data.warning) {
    return { 
      message: `${data.warning}（学生邮箱：${data.studentEmail || "未填写"}；顾问邮箱：${data.counselorEmail || "未填写"}）`, 
      type: "warning" 
    };
  }
  
  // Handle success
  if (data.success) {
    const recipientInfo = data.sentTo ? `（已发送给：${data.sentTo.join("、")}）` : "";
    const message = `${data.message} ${recipientInfo}`;
    
    // Handle partial errors
    if (data.errors && data.errors.length > 0) {
      setTimeout(() => {
        console.error("Some reminders failed:", data.errors);
        toast.warning("有部分提醒邮件没能发出，请稍后再试。");
      }, 1000);
    }
    
    return { message, type: "success" };
  } 
  
  // Handle empty todos case
  if (data.message === "No uncompleted todos to remind about") {
    return { message: "这位学生没有未完成的待办，不需要提醒。", type: "info" };
  }
  
  // Fallback for unexpected responses
  console.warn("Unexpected reminder response:", data);
  return { message: "提醒已处理，但没能确认是否发送成功。", type: "warning" };
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
