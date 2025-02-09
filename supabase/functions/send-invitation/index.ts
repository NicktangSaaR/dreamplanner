
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  token: string;
  expirationDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting invitation email process...");
    const { email, token, expirationDate }: InvitationEmailRequest = await req.json();
    const formattedExpiration = new Date(expirationDate).toLocaleDateString();
    
    console.log("Received request data:", { email, token, expirationDate });
    console.log("SUPABASE_URL:", Deno.env.get("SUPABASE_URL"));
    console.log("Resend API Key present:", !!Deno.env.get("RESEND_API_KEY"));

    const emailResponse = await resend.emails.send({
      from: "Journey Buddy <onboarding@resend.dev>",
      to: [email],
      subject: "You've been invited to Journey Buddy!",
      html: `
        <h1>Welcome to Journey Buddy!</h1>
        <p>You've been invited to join Journey Buddy as a student. Click the link below to create your account:</p>
        <p><a href="${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${token}&type=signup">Accept Invitation</a></p>
        <p><strong>This invitation link will expire on ${formattedExpiration}</strong></p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        <p>Best regards,<br>The Journey Buddy Team</p>
      `,
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
