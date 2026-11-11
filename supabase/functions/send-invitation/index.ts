import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Support both invitation and general email formats
interface EmailRequest {
  email: string;
  // For invitation emails
  token?: string;
  expirationDate?: string;
  // For general emails
  subject?: string;
  content?: string;
  isHtml?: boolean; // New: support HTML content directly
}

const deny = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting email process...");
    
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service not configured. Please add RESEND_API_KEY.");
    }
    
    const requestData: EmailRequest = await req.json();
    const { email, token, expirationDate, subject, content, isHtml } = requestData;

    // Only signed-in staff may send: counselors and admins can send student
    // invitations; only admins can send emails with their own subject and content.
    const authHeader = req.headers.get("Authorization") ?? "";
    const asUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return deny(401, "请先登录");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await admin.from("profiles").select("user_type").eq("id", user.id).maybeSingle();
    const role = profile?.user_type;
    const isGeneral = !!(subject && content);
    if (isGeneral ? role !== "admin" : role !== "admin" && role !== "counselor") {
      console.warn("send-invitation refused", { user: user.id, role, isGeneral });
      return deny(403, "没有权限发送这封邮件");
    }
    if (typeof email !== "string" || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return deny(400, "邮箱格式不对");

    const resend = new Resend(apiKey);
    
    console.log("Received request data:", { email, hasToken: !!token, hasSubject: !!subject, isHtml });

    let emailSubject: string;
    let emailHtml: string;

    // Check if this is a general email (has subject and content) or invitation email
    if (subject && content) {
      // General email format
      emailSubject = subject;
      // Check if content is already HTML or plain text
      if (isHtml) {
        emailHtml = content;
      } else {
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
          </div>
        `;
      }
    } else if (token && expirationDate) {
      // Invitation email: sign up, then pick the counselor on the home page.
      const signup = "https://dreamplaneredu.com/signup";
      const shown = email.replace(/[<>&"']/g, "");
      emailSubject = "邀请你加入 DreamPlanner 升学规划平台 · You're invited to DreamPlanner";
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <h2>欢迎加入 DreamPlanner</h2>
          <p>你的升学顾问邀请你使用 DreamPlanner。在这里，你可以看到顾问为你制定的规划方案、每个季度的目标和待办，还可以练习模拟面试。</p>
          <p><strong>只需两步：</strong></p>
          <ol>
            <li>点击下面的按钮，用这个邮箱（${shown}）注册账号。</li>
            <li>注册后登录，在主页点「选择我的顾问」，选择你的顾问老师，就完成关联了。</li>
          </ol>
          <p><a href="${signup}" style="display:inline-block;padding:10px 20px;background:#1f5c4d;color:#fff;text-decoration:none;border-radius:6px;">注册 DreamPlanner</a></p>
          <hr style="border:none;border-top:1px solid #ddd;margin:24px 0;" />
          <h2>Welcome to DreamPlanner</h2>
          <p>Your counselor has invited you to DreamPlanner, where you'll see the plan they've made for you, your goals and to-dos for each quarter, and can practise mock interviews.</p>
          <ol>
            <li>Sign up with this email address (${shown}): <a href="${signup}">${signup}</a></li>
            <li>After signing in, click "Choose my counselor" on your home page and pick your counselor.</li>
          </ol>
          <p style="color:#666;font-size:13px;">如果你没有预期收到这封邮件，可以直接忽略。If you weren't expecting this email, you can ignore it.</p>
        </div>
      `;
    } else {
      throw new Error("Invalid email request: must provide either (subject + content) or (token + expirationDate)");
    }

    // Provide a plain-text fallback to improve deliverability and readability
    // (Some mailbox providers may downrank HTML-only messages)
    const emailText = ((): string => {
      if (subject && content && !isHtml) return content;
      // naive HTML -> text fallback
      return emailHtml
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<br\s*\/?\s*>/gi, "\n")
        .replace(/<\/?p\s*>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    })();

    const emailResponse = await resend.emails.send({
      from: "DreamPlanner <noreply@dreamplaneredu.com>",
      to: [email],
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
