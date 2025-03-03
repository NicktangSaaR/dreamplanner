
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTodoReminder = (studentId: string | undefined) => {
  const sendReminder = useCallback(async () => {
    if (!studentId) {
      console.error("No student ID provided");
      toast.error("无法发送提醒：未找到学生ID");
      return;
    }
    
    try {
      const toastId = toast.loading("发送提醒中...");
      
      console.log("Invoking Edge Function with studentId:", studentId);
      
      // 调用Edge Function，明确指定domain
      const result = await supabase.functions.invoke('test-todo-reminders', {
        body: { 
          studentId, 
          debug: true,
          domain: "dreamplaneredu.com"  // 显式传递验证的域名
        }
      });
      
      // 解析响应
      const { data, error } = result;
      
      console.log("Edge Function response:", data);
      console.log("Edge Function error:", error);
      
      toast.dismiss(toastId);
      
      // 检查invoke错误
      if (error) {
        console.error("Error sending reminder (invoke error):", error);
        console.error("Error details:", JSON.stringify(error));
        
        // 检查非2xx错误
        if (typeof error === 'object' && error.message) {
          if (error.message.includes("Edge Function returned a non-2xx status code")) {
            // 这通常意味着Edge Function本身返回了一个错误状态码
            toast.error("服务器错误：Edge Function 返回了错误状态码，请检查日志");
            
            // 添加建议
            setTimeout(() => {
              toast.error("可能原因：Resend API 密钥无效或域名未验证，请检查 Supabase Edge Function 密钥和日志");
            }, 1000);
            
            return;
          }
        }
        
        toast.error(`发送提醒失败 (系统错误): ${JSON.stringify(error)}`);
        return;
      }
      
      // 处理无数据返回的情况
      if (!data) {
        toast.error("服务器返回了空响应，请检查 Edge Function 日志以获取详细信息");
        return;
      }
      
      // 处理Edge Function返回的错误
      if (data.error || (typeof data === 'string' && data.includes('error'))) {
        console.error("Edge Function returned an error:", data);
        
        // 尝试解析错误信息
        let errorInfo = data;
        if (typeof data === 'string') {
          try {
            errorInfo = JSON.parse(data);
          } catch (e) {
            // 如果无法解析为JSON，保持原样
          }
        }
        
        // 提供详细错误信息
        if (errorInfo.code === "from_address_not_allowed" || 
            (errorInfo.message && errorInfo.message.includes("from_address_not_allowed")) ||
            (errorInfo.error && errorInfo.error.includes("from_address_not_allowed"))) {
          toast.error(`域名验证错误: dreamplaneredu.com 未在Resend.com验证。请前往Resend.com验证您的域名`);
        } else if (errorInfo.code === "unauthorized" || 
                  (errorInfo.message && errorInfo.message.includes("unauthorized")) || 
                  (errorInfo.error && errorInfo.error.includes("unauthorized")) ||
                  (errorInfo.message && errorInfo.message.includes("API key"))) {
          toast.error(`API密钥错误: 请检查Supabase Edge Function配置中的Resend API密钥是否有效`);
        } else if (errorInfo.code === "invalid_api_key_format" || 
                  (errorInfo.message && errorInfo.message.includes("Invalid API key format"))) {
          toast.error(`API密钥格式错误: Resend API密钥应以're_'开头，请检查设置`);
        } else if (errorInfo.code === "missing_api_key" || 
                  (errorInfo.message && errorInfo.message.includes("missing"))) {
          toast.error(`缺少API密钥: RESEND_API_KEY 环境变量未设置，请在 Supabase Edge Function 密钥中设置`);
        } else {
          // 通用错误消息
          const errorMessage = errorInfo.message || errorInfo.error || JSON.stringify(errorInfo);
          toast.error(`提醒发送失败: ${errorMessage}`);
        }
        return;
      }
      
      // 处理警告信息
      if (data.warning) {
        toast.warning(`${data.warning}: 学生邮箱 (${data.studentEmail}), 辅导员邮箱 (${data.counselorEmail})`);
        return;
      }
      
      // 处理成功响应
      if (data.success) {
        // 显示提醒发送成功信息，并包含收件人信息
        const recipientInfo = data.sentTo ? `(发送给: ${data.sentTo.join(", ")})` : "";
        toast.success(`${data.message} ${recipientInfo}`);
        
        // 如果有部分错误，显示警告
        if (data.errors && data.errors.length > 0) {
          setTimeout(() => {
            toast.warning(`部分发送失败: ${data.errors.join("; ")}`);
          }, 1000);
        }
      } else if (data.message === "No uncompleted todos to remind about") {
        toast.info("该学生没有未完成的待办事项");
      } else {
        toast.warning(`操作完成，但返回了意外响应: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      console.error("Exception in send reminder:", err);
      console.error("Error details:", JSON.stringify(err));
      toast.dismiss();
      toast.error(`发送提醒失败 (应用错误): ${err.message || JSON.stringify(err)}`);
    }
  }, [studentId]);

  return { sendReminder };
};
