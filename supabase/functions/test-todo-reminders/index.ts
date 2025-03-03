
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

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
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the request body, which may contain a studentId
    const requestBody = await req.json().catch(() => ({}));
    const { studentId } = requestBody;
    
    console.log("Request received with studentId:", studentId);
    
    // Fetch todos based on studentId (if provided) or all uncompleted todos
    let query = supabase
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
      .eq("completed", false);
    
    // If a specific studentId is provided, only get todos for that student
    if (studentId) {
      query = query.eq("author_id", studentId);
    }
    
    const { data: todos, error: todosError } = await query;
    
    if (todosError) {
      console.error("Error fetching todos:", todosError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch todos" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!todos || todos.length === 0) {
      console.log("No uncompleted todos found");
      return new Response(
        JSON.stringify({ message: "No uncompleted todos to remind about" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found ${todos.length} uncompleted todos`);
    
    // Group todos by student
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
    
    // For each student, fetch their counselor
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
    
    console.log("Processed todos by student:", todosByStudent);
    
    // Send emails for each student with their todos
    const emailPromises = [];
    for (const studentId in todosByStudent) {
      const { student, counselor, todos } = todosByStudent[studentId];
      
      // Skip if student doesn't have an email
      if (!student?.email) {
        console.warn(`Student ${studentId} has no email. Skipping...`);
        continue;
      }
      
      // Create todo list HTML
      const todoListHtml = todos.map(todo => `
        <li style="margin-bottom: 8px;">
          <strong>${todo.title}</strong>
          ${todo.due_date ? ` - Due: ${new Date(todo.due_date).toLocaleDateString()}` : ''}
          ${todo.starred ? ' ⭐' : ''}
        </li>
      `).join('');
      
      // Create HTML template for email
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
      
      // Send email to student
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
        return error;
      });
      
      emailPromises.push(studentEmailPromise);
      
      // If there's a counselor, send them a copy too
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
          return error;
        });
        
        emailPromises.push(counselorEmailPromise);
      }
    }
    
    // Wait for all emails to be sent
    await Promise.all(emailPromises);
    
    console.log("All email reminders sent successfully");
    return new Response(
      JSON.stringify({ success: true, message: "Reminder emails sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in test-todo-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
