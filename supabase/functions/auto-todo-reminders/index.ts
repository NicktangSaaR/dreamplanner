import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Todo {
  id: string;
  title: string;
  due_date: string | null;
  author_id: string;
}

interface Student {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ReminderEmail {
  id: string;
  student_id: string;
  email: string;
  name: string | null;
}

/**
 * Auto Todo Reminders Edge Function
 * 
 * Supports three modes:
 * 1. Monthly reminder (mode: "monthly"): Sends on the 1st of each month for todos due in the next 40 days
 * 2. Weekly reminder (mode: "weekly"): Sends reminders for todos due in the next 7 days
 * 3. Urgent reminder (mode: "urgent"): Sends urgent reminders for todos due in the next 3 days
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    const domain = "dreamplaneredu.com";

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!resendApiKey) {
      throw new Error("Missing Resend API key");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "weekly"; // "monthly" or "weekly"
    const testStudentId = body.testStudentId; // For testing specific student
    const debug = body.debug || false;

    console.log(`Auto reminder running in ${mode} mode`);

    // Calculate date ranges
    const now = new Date();
    let dueDateStart: Date;
    let dueDateEnd: Date;

    if (mode === "monthly") {
      // Monthly: todos due in the next 40 days
      dueDateStart = now;
      dueDateEnd = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000);
    } else if (mode === "urgent") {
      // Urgent: todos due in the next 3 days
      dueDateStart = now;
      dueDateEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    } else {
      // Weekly: todos due in the next 7 days
      dueDateStart = now;
      dueDateEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const startDate = dueDateStart.toISOString().split("T")[0];
    const endDate = dueDateEnd.toISOString().split("T")[0];

    console.log(`Looking for todos due between ${startDate} and ${endDate}`);

    // Build query for todos
    let todosQuery = supabase
      .from("todos")
      .select("id, title, due_date, author_id")
      .eq("completed", false)
      .not("due_date", "is", null)
      .gte("due_date", startDate)
      .lte("due_date", endDate);

    if (testStudentId) {
      todosQuery = todosQuery.eq("author_id", testStudentId);
    }

    const { data: todos, error: todosError } = await todosQuery;

    if (todosError) {
      console.error("Error fetching todos:", todosError);
      throw todosError;
    }

    if (!todos || todos.length === 0) {
      console.log("No todos found in the date range");
      return new Response(
        JSON.stringify({ success: true, message: "No todos to remind about", emailsSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${todos.length} todos to process`);

    // Group todos by student
    const todosByStudent: Record<string, Todo[]> = {};
    for (const todo of todos) {
      if (!todosByStudent[todo.author_id]) {
        todosByStudent[todo.author_id] = [];
      }
      todosByStudent[todo.author_id].push(todo);
    }

    const studentIds = Object.keys(todosByStudent);
    console.log(`Found ${studentIds.length} students with upcoming todos`);

    // Fetch student profiles
    const { data: students, error: studentsError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);

    if (studentsError) {
      console.error("Error fetching students:", studentsError);
      throw studentsError;
    }

    // Fetch custom reminder emails for each student
    const { data: reminderEmails, error: reminderError } = await supabase
      .from("student_reminder_emails")
      .select("id, student_id, email, name")
      .in("student_id", studentIds);

    if (reminderError) {
      console.error("Error fetching reminder emails:", reminderError);
      // Continue without custom emails
    }

    // Build email recipients map
    const studentEmailsMap: Record<string, string[]> = {};
    const studentInfoMap: Record<string, Student> = {};

    for (const student of students || []) {
      studentInfoMap[student.id] = student;
      studentEmailsMap[student.id] = [];
      
      // Add student's own email if available
      if (student.email) {
        studentEmailsMap[student.id].push(student.email);
      }
    }

    // Add custom reminder emails
    for (const re of reminderEmails || []) {
      if (!studentEmailsMap[re.student_id]) {
        studentEmailsMap[re.student_id] = [];
      }
      if (!studentEmailsMap[re.student_id].includes(re.email)) {
        studentEmailsMap[re.student_id].push(re.email);
      }
    }

    // Send emails
    let emailsSent = 0;
    let emailsFailed = 0;
    const results: any[] = [];

    for (const studentId of studentIds) {
      const studentTodos = todosByStudent[studentId];
      const emails = studentEmailsMap[studentId] || [];
      const studentInfo = studentInfoMap[studentId];

      if (emails.length === 0) {
        console.log(`No email addresses for student ${studentId}, skipping`);
        continue;
      }

      const studentName = studentInfo?.full_name || "学生";
      const emailContent = generateEmailContent(studentName, studentTodos, mode);

      for (const email of emails) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `DreamPlane <noreply@${domain}>`,
              to: [email],
              subject: mode === "monthly" 
                ? `📅 月度待办提醒 - ${studentName} 的待完成事项`
                : mode === "urgent"
                ? `🚨 紧急提醒 - ${studentName} 有 ${studentTodos.length} 项待办即将到期！`
                : `⏰ 待办提醒 - ${studentName} 有 ${studentTodos.length} 项待办即将到期`,
              html: emailContent.html,
              text: emailContent.text,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Email sent to ${email} for student ${studentId}:`, data.id);
            emailsSent++;
            results.push({ email, studentId, success: true, messageId: data.id });
          } else {
            const error = await response.text();
            console.error(`Failed to send email to ${email}:`, error);
            emailsFailed++;
            results.push({ email, studentId, success: false, error });
          }
        } catch (err) {
          console.error(`Exception sending email to ${email}:`, err);
          emailsFailed++;
          results.push({ email, studentId, success: false, error: String(err) });
        }
      }
    }

    console.log(`Emails sent: ${emailsSent}, failed: ${emailsFailed}`);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        dateRange: { start: startDate, end: endDate },
        todosFound: todos.length,
        studentsProcessed: studentIds.length,
        emailsSent,
        emailsFailed,
        details: debug ? results : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in auto-todo-reminders:", error);
    return new Response(
      JSON.stringify({ error: String(error), message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateEmailContent(studentName: string, todos: Todo[], mode: string): { html: string; text: string } {
  const sortedTodos = [...todos].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const isUrgent = mode === "urgent";
  
  const todosHtml = sortedTodos.map((todo) => {
    const dueDate = todo.due_date ? new Date(todo.due_date).toLocaleDateString("zh-CN") : "无截止日期";
    const daysLeft = todo.due_date 
      ? Math.ceil((new Date(todo.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const urgencyColor = daysLeft !== null && daysLeft <= 1 ? "#dc2626" : daysLeft !== null && daysLeft <= 3 ? "#ea580c" : daysLeft !== null && daysLeft <= 7 ? "#f59e0b" : "#16a34a";
    const urgencyText = daysLeft !== null 
      ? daysLeft <= 0 ? "⚠️ 已过期" : daysLeft === 1 ? "🔥 明天到期" : daysLeft <= 3 ? `⚡ ${daysLeft}天后到期` : `${daysLeft}天后到期`
      : "";

    const rowBg = isUrgent && daysLeft !== null && daysLeft <= 1 ? "#fef2f2" : "";

    return `
      <tr style="background: ${rowBg};">
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${todo.title}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${dueDate}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="color: ${urgencyColor}; font-weight: 600;">${urgencyText}</span>
        </td>
      </tr>
    `;
  }).join("");

  const todosText = sortedTodos.map((todo) => {
    const dueDate = todo.due_date ? new Date(todo.due_date).toLocaleDateString("zh-CN") : "无截止日期";
    const daysLeft = todo.due_date 
      ? Math.ceil((new Date(todo.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const urgencyMark = daysLeft !== null && daysLeft <= 1 ? "🔥 " : daysLeft !== null && daysLeft <= 3 ? "⚡ " : "";
    return `${urgencyMark}• ${todo.title} (截止: ${dueDate})`;
  }).join("\n");

  const introText = mode === "monthly"
    ? `以下是 ${studentName} 在接下来40天内需要完成的待办事项：`
    : mode === "urgent"
    ? `⚠️ 紧急通知：${studentName} 有以下待办事项将在3天内到期，请务必及时完成！`
    : `以下是 ${studentName} 在接下来7天内需要完成的待办事项：`;

  // Urgent mode uses red/orange gradient, others use purple gradient
  const headerGradient = isUrgent 
    ? "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)"
    : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
  
  const headerTitle = mode === "monthly" 
    ? "📅 月度待办提醒" 
    : mode === "urgent" 
    ? "🚨 紧急待办提醒" 
    : "⏰ 待办提醒";

  const tableHeaderBg = isUrgent ? "#dc2626" : "#6366f1";

  const urgentBanner = isUrgent ? `
    <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
      <p style="margin: 0; color: #dc2626; font-size: 16px; font-weight: 600;">
        ⚠️ 以下待办事项即将到期，请立即处理！
      </p>
    </div>
  ` : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${headerGradient}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">
          ${headerTitle}
        </h1>
        ${isUrgent ? '<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">请立即查看并处理</p>' : ''}
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin-top: 0;">亲爱的家长/学生，</p>
        <p style="${isUrgent ? 'color: #dc2626; font-weight: 600;' : ''}">${introText}</p>
        
        ${urgentBanner}
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: ${tableHeaderBg}; color: white;">
              <th style="padding: 12px; text-align: left;">待办事项</th>
              <th style="padding: 12px; text-align: center;">截止日期</th>
              <th style="padding: 12px; text-align: center;">剩余时间</th>
            </tr>
          </thead>
          <tbody>
            ${todosHtml}
          </tbody>
        </table>
        
        <p>${isUrgent ? '⚡ 请确保尽快完成以上任务，避免错过截止日期！' : '请确保及时完成以上任务。'}如有任何问题，请随时联系我们。</p>
        
        <p style="margin-bottom: 0;">
          祝学业顺利！<br>
          <strong>DreamPlane 团队</strong>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p>此邮件由系统自动发送，请勿直接回复。</p>
        <p>© ${new Date().getFullYear()} DreamPlane Education. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
${headerTitle}

亲爱的家长/学生，

${introText}

${todosText}

${isUrgent ? '⚡ 请确保尽快完成以上任务，避免错过截止日期！' : '请确保及时完成以上任务。'}如有任何问题，请随时联系我们。

祝学业顺利！
DreamPlane 团队

---
此邮件由系统自动发送，请勿直接回复。
© ${new Date().getFullYear()} DreamPlane Education. All rights reserved.
  `.trim();

  return { html, text };
}
