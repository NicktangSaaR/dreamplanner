
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createEmailService } from "./email-service.ts";
import { createDatabaseService } from "./db-service.ts";
import { corsHeaders } from "./cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 获取请求体
    const requestBody = await req.json().catch((e) => {
      console.error("Failed to parse request body:", e);
      return {};
    });
    const { studentId, debug, domain = "dreamplaneredu.com" } = requestBody;
    
    console.log("Request received with studentId:", studentId, "debug mode:", debug, "domain:", domain);
    
    // 列出所有环境变量名称（不包含值）以便调试
    const envVars = Object.keys(Deno.env.toObject());
    console.log("Available environment variables:", envVars);
    
    // 尝试不同格式的API密钥名称
    const possibleKeyNames = [
      "Remind API", 
      "REMIND_API", 
      "remind_api",
      "RESEND_API_KEY", 
      "resend_api_key"
    ];
    
    let resendApiKey = null;
    for (const keyName of possibleKeyNames) {
      const value = Deno.env.get(keyName);
      if (value) {
        resendApiKey = value;
        console.log(`Found API key with name: "${keyName}"`);
        break;
      }
    }
    
    // 安全地验证API密钥格式（不输出完整密钥）
    if (resendApiKey) {
      console.log(`Found API key with prefix: ${resendApiKey.substring(0, 3)}***`);
      console.log(`API key length: ${resendApiKey.length} characters`);
    } else {
      console.error("No Resend API key found. Tried the following names:", possibleKeyNames);
      return new Response(
        JSON.stringify({ 
          error: "Email service configuration is missing", 
          details: "Could not find API key with any of the expected names",
          checkedNames: possibleKeyNames,
          availableEnvVars: envVars
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 验证studentId
    if (!studentId) {
      console.error("No studentId provided");
      return new Response(
        JSON.stringify({ error: "Student ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 初始化服务
    try {
      console.log("Creating email service with API key");
      const emailService = createEmailService(resendApiKey);
      console.log("Email service initialized successfully");
      
      // 测试API密钥和域名设置
      try {
        console.log(`Testing email service with domain: ${domain}`);
        const testResult = await emailService.testApiKey(domain);
        console.log("API key validation test successful:", JSON.stringify(testResult));
      } catch (testError) {
        console.error("API key validation failed:", testError);
        console.error("Error details:", JSON.stringify(testError));
        
        // 检查是否是域名验证错误
        const errorMessage = String(testError);
        if (errorMessage.includes("from_address_not_allowed")) {
          return new Response(
            JSON.stringify({ 
              error: `From address 'reminder@${domain}' is not allowed. Please verify your domain in Resend.`,
              domain: domain,
              details: errorMessage
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (errorMessage.includes("validation")) {
          return new Response(
            JSON.stringify({ 
              error: `Failed to validate API key with domain ${domain}`,
              domain: domain,
              details: errorMessage
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            error: "API key validation failed", 
            domain: domain,
            details: errorMessage
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
        return new Response(
          JSON.stringify({ 
            error: "Supabase configuration is missing"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Creating database service");
      const dbService = createDatabaseService(supabaseUrl, supabaseKey);
      console.log("Database service initialized successfully");
      
      // 获取todos
      console.log("Fetching uncompleted todos for student:", studentId);
      const todos = await dbService.getUncompletedTodos(studentId);
      
      if (!todos || todos.length === 0) {
        console.log("No uncompleted todos found for student:", studentId);
        return new Response(
          JSON.stringify({ message: "No uncompleted todos to remind about" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`Found ${todos.length} uncompleted todos for student:`, studentId);
      
      // 整理所有未完成的待办事项来生成邮件内容
      const todoListHtml = todos.map(todo => `
        <li style="margin-bottom: 8px;">
          <strong>${todo.title}</strong>
          ${todo.due_date ? ` - Due: ${new Date(todo.due_date).toLocaleDateString()}` : ''}
          ${todo.starred ? ' ⭐' : ''}
        </li>
      `).join('');
      
      // 获取学生信息
      const studentInfo = todos.length > 0 ? todos[0].profiles : null;
      const studentName = studentInfo?.full_name || '学生';
      const studentEmail = studentInfo?.email || null;

      // 记录学生邮箱信息用于调试
      console.log("Student email:", studentEmail);
      
      // 获取学生对应的辅导员信息
      console.log("Fetching counselor for student:", studentId);
      const counselorInfo = await dbService.getCounselorForStudent(studentId);
      const counselorEmail = counselorInfo?.email || null;
      const counselorName = counselorInfo?.full_name || "辅导员";
      
      console.log("Counselor email:", counselorEmail);
      
      // 创建邮件HTML模板
      const studentHtmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              h1 { color: #2563eb; }
              ul { padding-left: 20px; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>待办事项提醒</h1>
              <p>亲爱的 ${studentName},</p>
              <p>请查看以下您需要完成的待办事项:</p>
              <ul>
                ${todoListHtml}
              </ul>
              <p>请尽快完成这些待办事项，以保持您的申请进度。</p>
              <div class="footer">
                <p>此邮件由 DreamPlane Education 自动发送，请勿回复。</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      // 为辅导员创建不同的邮件内容
      const counselorHtmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              h1 { color: #2563eb; }
              ul { padding-left: 20px; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>学生待办事项提醒</h1>
              <p>亲爱的 ${counselorName},</p>
              <p>您的学生 ${studentName} 有以下未完成的待办事项:</p>
              <ul>
                ${todoListHtml}
              </ul>
              <p>这些提醒已经同时发送给了学生本人。</p>
              <div class="footer">
                <p>此邮件由 DreamPlane Education 自动发送，请勿回复。</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      const sentEmails = [];
      let emailSendingErrors = [];
      
      try {
        // 发送邮件给学生
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
        
        // 发送邮件给辅导员
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
        
        // 处理发送结果
        if (sentEmails.length > 0) {
          const recipients = sentEmails.join("和");
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `提醒邮件已成功发送给${recipients}`,
              sentTo: sentEmails,
              errors: emailSendingErrors.length > 0 ? emailSendingErrors : undefined,
              domain: domain
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else if (emailSendingErrors.length > 0) {
          return new Response(
            JSON.stringify({ 
              error: "邮件发送失败", 
              details: emailSendingErrors.join("; "),
              domain: domain
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ 
              warning: "未找到有效的收件人邮箱地址", 
              studentEmail: studentEmail || "未设置",
              counselorEmail: counselorEmail || "未设置",
              domain: domain
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (emailError) {
        console.error("Exception while sending email:", emailError);
        console.error("Error details:", JSON.stringify(emailError));
        
        // 检查是否是域名验证错误
        const errorMessage = String(emailError);
        if (errorMessage.includes("from_address_not_allowed")) {
          return new Response(
            JSON.stringify({ 
              error: `From address 'reminder@${domain}' is not allowed. Please verify your domain in Resend.`,
              domain: domain,
              details: errorMessage
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            error: "Email sending exception", 
            domain: domain,
            details: errorMessage
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (initError) {
      console.error("Failed to initialize services:", initError);
      console.error("Error details:", JSON.stringify(initError));
      return new Response(
        JSON.stringify({ 
          error: "Failed to initialize services", 
          details: String(initError) 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in test-todo-reminders function:", error);
    console.error("Error details:", JSON.stringify(error));
    return new Response(
      JSON.stringify({ 
        error: String(error),
        stack: error.stack,
        message: error.message,
        errorObject: JSON.stringify(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
