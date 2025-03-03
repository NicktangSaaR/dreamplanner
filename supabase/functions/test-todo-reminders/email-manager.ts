
import { createEmailService } from "./email-service.ts";
import { generateEmailContent } from "./email-templates.ts";
import { formatErrorResponse } from "./error-handling.ts";

/**
 * Email Manager - handles all email sending operations and related logic
 */
export class EmailManager {
  private emailService;
  private domain: string;
  
  constructor(apiKey: string, domain: string = "dreamplaneredu.com") {
    this.emailService = createEmailService(apiKey);
    this.domain = domain;
  }
  
  /**
   * Sends reminder emails to student and counselor
   */
  async sendReminderEmails(todos: any[], studentInfo: any, counselorInfo: any) {
    const studentName = studentInfo?.full_name || '学生';
    const studentEmail = studentInfo?.email || null;
    const counselorEmail = counselorInfo?.email || null;
    const counselorName = counselorInfo?.full_name || "辅导员";
    
    // Generate email content
    const { studentHtmlContent, counselorHtmlContent } = generateEmailContent(
      todos,
      studentName,
      counselorName
    );
    
    const sentEmails = [];
    let emailSendingErrors = [];
    
    try {
      // Send email to student
      if (studentEmail) {
        console.log(`Sending email to student: ${studentEmail} using domain: ${this.domain}`);
        
        const studentEmailResult = await this.emailService.sendReminderEmail(
          studentEmail,
          `待办事项提醒 - ${studentName}`,
          studentHtmlContent,
          this.domain
        );
        
        console.log("Student email sending result:", JSON.stringify(studentEmailResult));
        
        if (studentEmailResult.success) {
          sentEmails.push("student");
        } else if (studentEmailResult.error) {
          emailSendingErrors.push(`学生邮件错误: ${studentEmailResult.message || JSON.stringify(studentEmailResult.error)}`);
        }
      } else {
        console.log("No student email available, skipping student email");
      }
      
      // Send email to counselor
      if (counselorEmail) {
        console.log(`Sending email to counselor: ${counselorEmail} using domain: ${this.domain}`);
        
        const counselorEmailResult = await this.emailService.sendReminderEmail(
          counselorEmail,
          `学生待办事项提醒 - ${studentName}`,
          counselorHtmlContent,
          this.domain
        );
        
        console.log("Counselor email sending result:", JSON.stringify(counselorEmailResult));
        
        if (counselorEmailResult.success) {
          sentEmails.push("counselor");
        } else if (counselorEmailResult.error) {
          emailSendingErrors.push(`辅导员邮件错误: ${counselorEmailResult.message || JSON.stringify(counselorEmailResult.error)}`);
        }
      } else {
        console.log("No counselor email available, skipping counselor email");
      }
      
      // Process sending results
      if (sentEmails.length > 0) {
        const recipients = sentEmails.join("和");
        return { 
          success: true, 
          message: `提醒邮件已成功发送给${recipients}`,
          sentTo: sentEmails,
          errors: emailSendingErrors.length > 0 ? emailSendingErrors : undefined,
          domain: this.domain
        };
      } else if (emailSendingErrors.length > 0) {
        return { 
          error: "邮件发送失败", 
          details: emailSendingErrors.join("; "),
          domain: this.domain
        };
      } else {
        return { 
          warning: "未找到有效的收件人邮箱地址", 
          studentEmail: studentEmail || "未设置",
          counselorEmail: counselorEmail || "未设置",
          domain: this.domain
        };
      }
    } catch (emailError) {
      console.error("Exception while sending email:", emailError);
      console.error("Error details:", JSON.stringify(emailError, Object.getOwnPropertyNames(emailError)));
      
      // Check if it's a domain verification error
      const errorMessage = String(emailError);
      if (errorMessage.includes("from_address_not_allowed")) {
        return { 
          error: `From address 'reminder@${this.domain}' is not allowed. Please verify your domain in Resend.`,
          domain: this.domain,
          details: errorMessage
        };
      }
      
      return { 
        error: "Email sending exception", 
        domain: this.domain,
        details: errorMessage
      };
    }
  }
}
