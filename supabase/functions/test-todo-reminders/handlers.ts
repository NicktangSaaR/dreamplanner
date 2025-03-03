
import { createEmailService } from "./email-service.ts";
import { createDatabaseService } from "./db-service.ts";
import { formatErrorResponse } from "./error-handling.ts";
import { generateEmailContent } from "./email-templates.ts";

/**
 * Handles the reminder request processing
 */
export async function processReminderRequest(requestBody: any) {
  const { studentId, debug, domain = "dreamplaneredu.com" } = requestBody;
  
  console.log("Request received with studentId:", studentId, "debug mode:", debug, "domain:", domain);
  
  // List all environment variables names (without values) for debugging
  const envVars = Object.keys(Deno.env.toObject());
  console.log("Available environment variables:", envVars);
  
  // Get Resend API key with proper error handling
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.error("RESEND_API_KEY environment variable is not set");
    return { 
      error: "Email service configuration is missing", 
      details: "RESEND_API_KEY environment variable is not set. Please add it to your Supabase Edge Function secrets.",
      availableEnvVars: envVars
    };
  }
  
  // Safely validate API key format (without outputting the full key)
  console.log(`Found API key with prefix: ${resendApiKey.substring(0, 3)}***`);
  console.log(`API key length: ${resendApiKey.length} characters`);
  
  // Check for correct prefix for Resend API keys
  if (!resendApiKey.startsWith("re_")) {
    console.error("API key has incorrect format. Resend API keys should start with 're_'");
    return { 
      error: "API key has incorrect format", 
      details: "Resend API keys should start with 're_'. Please check your Supabase Edge Function secrets.",
      availableEnvVars: envVars
    };
  }
  
  // Validate studentId
  if (!studentId) {
    console.error("No studentId provided");
    return { error: "Student ID is required" };
  }
  
  // Initialize services
  try {
    console.log("Creating email service with API key");
    const emailService = createEmailService(resendApiKey);
    console.log("Email service initialized successfully");
    
    // Test API key and domain settings
    try {
      console.log(`Testing email service with domain: ${domain}`);
      const testResult = await emailService.testApiKey(domain);
      console.log("API key validation test successful:", JSON.stringify(testResult));
    } catch (testError) {
      console.error("API key validation failed:", testError);
      console.error("Error details:", JSON.stringify(testError, Object.getOwnPropertyNames(testError)));
      
      // Check if it's a domain verification error
      const errorMessage = String(testError);
      if (errorMessage.includes("from_address_not_allowed")) {
        return { 
          error: `From address 'reminder@${domain}' is not allowed. Please verify your domain in Resend.`,
          domain: domain,
          details: errorMessage
        };
      }
      
      if (errorMessage.includes("validation")) {
        return { 
          error: `Failed to validate API key with domain ${domain}`,
          domain: domain,
          details: errorMessage
        };
      }
      
      return { 
        error: "API key validation failed", 
        domain: domain,
        details: errorMessage
      };
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
      return { 
        error: "Supabase configuration is missing",
        availableEnvVars: envVars 
      };
    }
    
    console.log("Creating database service");
    const dbService = createDatabaseService(supabaseUrl, supabaseKey);
    console.log("Database service initialized successfully");
    
    return await sendEmailReminders(studentId, domain, emailService, dbService);
  } catch (initError) {
    console.error("Failed to initialize services:", initError);
    console.error("Error details:", JSON.stringify(initError, Object.getOwnPropertyNames(initError)));
    return { 
      error: "Failed to initialize services", 
      details: String(initError) 
    };
  }
}

/**
 * Handles sending the email reminders
 */
async function sendEmailReminders(studentId: string, domain: string, emailService: any, dbService: any) {
  try {
    // Get todos
    console.log("Fetching uncompleted todos for student:", studentId);
    const todos = await dbService.getUncompletedTodos(studentId);
    
    if (!todos || todos.length === 0) {
      console.log("No uncompleted todos found for student:", studentId);
      return { message: "No uncompleted todos to remind about" };
    }
    
    console.log(`Found ${todos.length} uncompleted todos for student:`, studentId);
    
    // Get student information
    const studentInfo = todos.length > 0 ? todos[0].profiles : null;
    const studentName = studentInfo?.full_name || '学生';
    const studentEmail = studentInfo?.email || null;

    // Log student email information for debugging
    console.log("Student email:", studentEmail);
    
    // Get the counselor information for the student
    console.log("Fetching counselor for student:", studentId);
    const counselorInfo = await dbService.getCounselorForStudent(studentId);
    const counselorEmail = counselorInfo?.email || null;
    const counselorName = counselorInfo?.full_name || "辅导员";
    
    console.log("Counselor email:", counselorEmail);
    
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
        console.log(`Sending email to student: ${studentEmail} using domain: ${domain}`);
        
        const studentEmailResult = await emailService.sendReminderEmail(
          studentEmail,
          `待办事项提醒 - ${studentName}`,
          studentHtmlContent,
          domain
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
        console.log(`Sending email to counselor: ${counselorEmail} using domain: ${domain}`);
        
        const counselorEmailResult = await emailService.sendReminderEmail(
          counselorEmail,
          `学生待办事项提醒 - ${studentName}`,
          counselorHtmlContent,
          domain
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
          domain: domain
        };
      } else if (emailSendingErrors.length > 0) {
        return { 
          error: "邮件发送失败", 
          details: emailSendingErrors.join("; "),
          domain: domain
        };
      } else {
        return { 
          warning: "未找到有效的收件人邮箱地址", 
          studentEmail: studentEmail || "未设置",
          counselorEmail: counselorEmail || "未设置",
          domain: domain
        };
      }
    } catch (emailError) {
      console.error("Exception while sending email:", emailError);
      console.error("Error details:", JSON.stringify(emailError, Object.getOwnPropertyNames(emailError)));
      
      // Check if it's a domain verification error
      const errorMessage = String(emailError);
      if (errorMessage.includes("from_address_not_allowed")) {
        return { 
          error: `From address 'reminder@${domain}' is not allowed. Please verify your domain in Resend.`,
          domain: domain,
          details: errorMessage
        };
      }
      
      return { 
        error: "Email sending exception", 
        domain: domain,
        details: errorMessage
      };
    }
  } catch (error) {
    console.error("Error in sendEmailReminders:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return formatErrorResponse(error, domain);
  }
}
