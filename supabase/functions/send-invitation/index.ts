import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
}

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
    
    const resend = new Resend(apiKey);
    const requestData: EmailRequest = await req.json();
    const { email, token, expirationDate, subject, content } = requestData;
    
    console.log("Received request data:", { email, hasToken: !!token, hasSubject: !!subject });

    let emailSubject: string;
    let emailHtml: string;

    // Check if this is a general email (has subject and content) or invitation email
    if (subject && content) {
      // General email format
      emailSubject = subject;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
        </div>
      `;
    } else if (token && expirationDate) {
      // Invitation email format
      const formattedExpiration = new Date(expirationDate).toLocaleTimeString();
      emailSubject = "You've been invited to Journey Buddy!";
      emailHtml = `
        <h1>Welcome to Journey Buddy!</h1>
        <p>You've been invited to join Journey Buddy as a student. Click the link below to create your account:</p>
        <p><a href="${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${token}&type=signup">Accept Invitation</a></p>
        <p><strong>This invitation link will expire at ${formattedExpiration}</strong></p>
        <p>If you don't accept within 1 minute, the counselor can send you a new invitation.</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        <p>Best regards,<br>The Journey Buddy Team</p>
      `;
    } else {
      throw new Error("Invalid email request: must provide either (subject + content) or (token + expirationDate)");
    }

    const emailResponse = await resend.emails.send({
      from: "DreamPlanner <noreply@dreamplaneredu.com>",
      to: [email],
      subject: emailSubject,
      html: emailHtml,
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

serve(handler);
