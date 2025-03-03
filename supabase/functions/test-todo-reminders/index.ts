
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
    // 列出所有环境变量名称（不包含值）以便调试
    const envVars = Object.keys(Deno.env.toObject());
    console.log("Available environment variables:", envVars);
    
    // 尝试不同格式的API密钥名称（包括不同的大小写组合）
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
      
      if (!resendApiKey.startsWith("re_")) {
        console.warn("Warning: API key doesn't start with 're_', which is typical for Resend API keys");
      }
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
    
    // 获取 VERIFIED_EMAIL 环境变量 (您需要在Supabase中设置此环境变量为您的已验证邮箱)
    const verifiedEmail = Deno.env.get("VERIFIED_EMAIL") || "nicktangbusiness87@gmail.com";
    console.log("Using verified email for testing:", verifiedEmail);
    
    // 执行简单的测试来验证API密钥是否有效
    try {
      console.log("Performing basic API key validation test");
      const testEmailResult = await resend.emails.send({
        from: "Resend Test <onboarding@resend.dev>", // 使用Resend默认发件人
        to: verifiedEmail, // 使用已验证的邮箱
        subject: "API Key Test",
        html: "<p>This is a test email to verify the API key.</p>",
        text: "This is a test email to verify the API key."
      });
      
      console.log("API key validation test response:", testEmailResult);
      
      if (testEmailResult.error) {
        console.error("API key validation failed:", testEmailResult.error);
        return new Response(
          JSON.stringify({ 
            error: "API key validation failed", 
            details: testEmailResult.error
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (testError) {
      console.error("API key validation failed with exception:", testError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to validate API key", 
          details: String(testError)
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
            <h1>待办事项提醒 - 测试</h1>
            <p>这是一封发送给学生 ${studentName} 的待办事项提醒测试邮件。</p>
            <p>未完成的待办事项:</p>
            <ul>
              ${todoListHtml}
            </ul>
            <p>在正式部署前，此测试邮件发送到您的验证邮箱。</p>
            <div class="footer">
              <p>此邮件由系统自动发送，请勿回复。</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // 仅发送到已验证的邮箱地址
    try {
      console.log(`Sending test email to verified email: ${verifiedEmail}`);
      const emailResult = await resend.emails.send({
        from: "College Planning <onboarding@resend.dev>",  // 使用Resend默认发件人
        to: verifiedEmail,  // 只发送到验证过的邮箱
        subject: `待办事项提醒测试 - 学生: ${studentName}`,
        html: htmlContent,
      });
      
      console.log("Email sending result:", emailResult);
      
      if (emailResult.error) {
        console.error("Error sending email:", emailResult.error);
        return new Response(
          JSON.stringify({ 
            error: "Failed to send email", 
            details: emailResult.error 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "测试邮件已发送到您的验证邮箱", 
          note: "要发送到实际学生邮箱，请在Resend验证您的域名"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("Exception while sending email:", emailError);
      return new Response(
        JSON.stringify({ 
          error: "Email sending exception", 
          details: String(emailError) 
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
