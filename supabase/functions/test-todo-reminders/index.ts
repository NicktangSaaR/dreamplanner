
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 列出环境变量（安全地仅显示名称）以便调试
    console.log("Available environment variables:", Object.keys(Deno.env.toObject()));
    
    // 检查API密钥 - 首先尝试"Remind API"，然后尝试"RESEND_API_KEY"
    const resendApiKey = Deno.env.get("Remind API") || Deno.env.get("RESEND_API_KEY");
    
    // 安全地验证API密钥格式（不输出完整密钥）
    if (resendApiKey) {
      console.log(`Found API key with prefix: ${resendApiKey.substring(0, 3)}***`);
      console.log(`API key length: ${resendApiKey.length} characters`);
      
      if (!resendApiKey.startsWith("re_")) {
        console.warn("Warning: API key doesn't start with 're_', which is typical for Resend API keys");
      }
    } else {
      console.error("No Resend API key found - checked RESEND_API_KEY and Remind API");
      return new Response(
        JSON.stringify({ 
          error: "Email service configuration is missing", 
          details: "Please set RESEND_API_KEY or Remind API in Supabase Edge Function secrets",
          availableEnvVars: Object.keys(Deno.env.toObject()).join(", ")
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 初始化resend
    let resend;
    try {
      resend = new Resend(resendApiKey);
      console.log("Resend client initialized successfully");
    } catch (initError) {
      console.error("Failed to initialize Resend client:", initError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to initialize email service", 
          details: String(initError) 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 初始化Supabase客户端
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
      return new Response(
        JSON.stringify({ 
          error: "Supabase configuration is missing",
          details: "Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized with URL:", supabaseUrl);
    
    // 获取请求体
    const requestBody = await req.json().catch(() => ({}));
    const { studentId, debug } = requestBody;
    
    console.log("Request received with studentId:", studentId, "debug mode:", debug);
    
    // 验证studentId
    if (!studentId) {
      console.error("No studentId provided");
      return new Response(
        JSON.stringify({ error: "Student ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 测试发送一封简单的邮件以验证API密钥
    if (debug) {
      try {
        console.log("Debug mode: Testing API key with simple email");
        const testEmail = "test@example.com"; // 仅用于测试，不会真正发送
        
        const testEmailResponse = await resend.emails.send({
          from: "Test <onboarding@resend.dev>",
          to: testEmail,
          subject: "API Key Test",
          html: "<p>This is a test email to verify the API key.</p>",
        });
        
        console.log("Test email response:", testEmailResponse);
        
        if (testEmailResponse.error) {
          return new Response(
            JSON.stringify({ 
              error: "API key validation failed", 
              details: testEmailResponse.error
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (testError) {
        console.error("API key validation failed:", testError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to validate API key", 
            details: String(testError)
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // 获取todos
    console.log("Fetching uncompleted todos for student:", studentId);
    const { data: todos, error: todosError } = await supabase
      .from("todos")
      .select(`
        id, 
        title, 
        completed, 
        starred, 
        due_date, 
        author_id,
        profiles:author_id (
          id,
          email,
          full_name,
          user_type
        )
      `)
      .eq("author_id", studentId)
      .eq("completed", false);
    
    if (todosError) {
      console.error("Error fetching todos:", todosError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch todos", details: todosError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!todos || todos.length === 0) {
      console.log("No uncompleted todos found for student:", studentId);
      return new Response(
        JSON.stringify({ message: "No uncompleted todos to remind about" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found ${todos.length} uncompleted todos for student:`, studentId);
    
    // 按学生分组todos
    const todosByStudent = todos.reduce((acc, todo) => {
      const studentId = todo.author_id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: todo.profiles,
          todos: []
        };
      }
      acc[studentId].todos.push(todo);
      return acc;
    }, {});
    
    // 获取每个学生的辅导员
    for (const studentId in todosByStudent) {
      const { data: relationships, error: relError } = await supabase
        .from("counselor_student_relationships")
        .select(`
          counselor_id,
          counselor:counselor_id (
            id,
            email,
            full_name
          )
        `)
        .eq("student_id", studentId)
        .maybeSingle();
      
      if (relError) {
        console.error(`Error fetching counselor for student ${studentId}:`, relError);
        continue;
      }
      
      todosByStudent[studentId].counselor = relationships?.counselor || null;
    }
    
    console.log("Processed todos by student:", Object.keys(todosByStudent).length, "students");
    
    // 为每个学生发送邮件
    const emailPromises = [];
    for (const studentId in todosByStudent) {
      const { student, counselor, todos } = todosByStudent[studentId];
      
      // 如果学生没有邮箱则跳过
      if (!student?.email) {
        console.warn(`Student ${studentId} has no email. Skipping...`);
        continue;
      }
      
      // 创建todo列表HTML
      const todoListHtml = todos.map(todo => `
        <li style="margin-bottom: 8px;">
          <strong>${todo.title}</strong>
          ${todo.due_date ? ` - Due: ${new Date(todo.due_date).toLocaleDateString()}` : ''}
          ${todo.starred ? ' ⭐' : ''}
        </li>
      `).join('');
      
      // 创建邮件HTML模板
      const htmlContent = `
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
              <p>亲爱的 ${student.full_name || '学生'},</p>
              <p>以下是您目前尚未完成的待办事项:</p>
              <ul>
                ${todoListHtml}
              </ul>
              <p>请尽快完成这些任务。如有任何问题，请联系您的辅导员。</p>
              <div class="footer">
                <p>此邮件由系统自动发送，请勿回复。</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      // 发送邮件给学生
      try {
        console.log(`Attempting to send email to student ${student.email}`);
        const studentEmailPromise = resend.emails.send({
          from: "College Planning Assistant <noreply@resend.dev>",
          to: student.email,
          subject: "待办事项提醒",
          html: htmlContent,
        }).then(result => {
          console.log(`Email sent to student ${student.full_name} (${student.email}):`, result);
          return result;
        }).catch(error => {
          console.error(`Error sending email to student ${student.email}:`, error);
          throw error;
        });
        
        emailPromises.push(studentEmailPromise);
      } catch (emailError) {
        console.error(`Failed to send email to student ${student.email}:`, emailError);
        // 即使一封邮件失败也继续发送其他邮件
      }
      
      // 如果有辅导员，也给他们发送一份副本
      if (counselor?.email) {
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
                <p>亲爱的 ${counselor.full_name || '辅导员'},</p>
                <p>您的学生 ${student.full_name || '学生'} 目前有以下尚未完成的待办事项:</p>
                <ul>
                  ${todoListHtml}
                </ul>
                <p>这是一份提醒，以便您能够跟进学生的进度。</p>
                <div class="footer">
                  <p>此邮件由系统自动发送，请勿回复。</p>
                </div>
              </div>
            </body>
          </html>
        `;
        
        try {
          console.log(`Attempting to send email to counselor ${counselor.email}`);
          const counselorEmailPromise = resend.emails.send({
            from: "College Planning Assistant <noreply@resend.dev>",
            to: counselor.email,
            subject: `学生待办事项提醒 - ${student.full_name || '学生'}`,
            html: counselorHtmlContent,
          }).then(result => {
            console.log(`Email sent to counselor ${counselor.full_name} (${counselor.email}):`, result);
            return result;
          }).catch(error => {
            console.error(`Error sending email to counselor ${counselor.email}:`, error);
            throw error;
          });
          
          emailPromises.push(counselorEmailPromise);
        } catch (emailError) {
          console.error(`Failed to send email to counselor ${counselor.email}:`, emailError);
          // 即使一封邮件失败也继续发送其他邮件
        }
      }
    }
    
    // 等待所有邮件发送完成
    try {
      await Promise.all(emailPromises);
      console.log("All email reminders sent successfully");
      return new Response(
        JSON.stringify({ success: true, message: "Reminder emails sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("Error sending some or all emails:", emailError);
      return new Response(
        JSON.stringify({ 
          error: "Some emails failed to send", 
          details: String(emailError),
          errorObject: JSON.stringify(emailError)
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in test-todo-reminders function:", error);
    return new Response(
      JSON.stringify({ 
        error: String(error),
        stack: error.stack,
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
