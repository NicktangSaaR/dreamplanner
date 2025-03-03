
/**
 * Processes Edge Function invoke errors
 */
export const handleInvokeError = (error: any): string => {
  console.error("Error sending reminder (invoke error):", error);
  console.error("Error details:", JSON.stringify(error));
  
  // Check for connection errors
  if (error.isConnectionError) {
    console.error("Connection error detected:", error.message);
    
    // Show more helpful message
    setTimeout(() => {
      import("sonner").then(({ toast }) => {
        toast.error("Edge Function 连接失败，可能原因: 1) Supabase 项目休眠 2) 网络连接问题 3) Edge Function 部署问题", {
          description: "请访问 Supabase 控制台以激活项目，然后重试",
          duration: 5000
        });
      });
    }, 1000);
    
    return "无法连接到 Edge Function，请检查 Supabase 项目状态和网络连接";
  }
  
  // Check for FunctionsFetchError specifically
  if (error.name === "FunctionsFetchError") {
    console.error("FunctionsFetchError detected. This typically indicates a connection issue to the Edge Function.");
    
    // Show more helpful message about Supabase edge function configuration
    setTimeout(() => {
      import("sonner").then(({ toast }) => {
        toast.error("Edge Function 连接失败", {
          description: "请确保 Edge Function 已部署，且 Supabase 项目处于活动状态。检查 Edge Function 密钥是否正确设置。",
          duration: 5000
        });
      });
    }, 1000);
    
    return "Edge Function 调用失败，请检查 Edge Function 部署状态和密钥配置";
  }
  
  // Check for non-2xx errors
  if (typeof error === 'object' && error.message) {
    if (error.message.includes("Edge Function returned a non-2xx status code")) {
      // Provide additional suggestions
      setTimeout(() => {
        import("sonner").then(({ toast }) => {
          toast.error("可能原因：Remind API 密钥无效或域名未验证", {
            description: "请检查 Supabase Edge Function 密钥和日志",
            duration: 5000
          });
        });
      }, 1000);
      
      return "服务器错误：Edge Function 返回了错误状态码，请检查日志";
    }
  }
  
  // Generic error
  return `发送提醒失败 (系统错误): ${JSON.stringify(error)}`;
};

/**
 * Processes domain verification errors
 */
export const handleDomainVerificationError = (errorInfo: any): string => {
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
export const handleApiKeyError = (errorInfo: any): string => {
  if (errorInfo.code === "unauthorized" || 
      (errorInfo.message && errorInfo.message.includes("unauthorized")) || 
      (errorInfo.error && errorInfo.error.includes("unauthorized")) ||
      (errorInfo.message && errorInfo.message.includes("API key"))) {
    return `API密钥错误: 请检查Supabase Edge Function配置中的Remind API密钥是否有效`;
  } else if (errorInfo.code === "invalid_api_key_format" || 
            (errorInfo.message && errorInfo.message.includes("Invalid API key format"))) {
    return `API密钥格式错误: Resend API密钥应以're_'开头，请检查设置`;
  } else if (errorInfo.code === "missing_api_key" || 
            (errorInfo.message && errorInfo.message.includes("missing"))) {
    return `缺少API密钥: Remind API 环境变量未设置，请在 Supabase Edge Function 密钥中设置`;
  }
  return "";
};
