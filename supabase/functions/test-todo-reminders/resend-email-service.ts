import { Resend } from "https://esm.sh/resend@2.0.0";
import { EmailService } from "./email-interface.ts";
import { formatErrorResponse } from "./error-handling.ts";

/**
 * Resend.com implementation of the EmailService interface
 */
export class ResendEmailService implements EmailService {
  private resend: Resend;
  private verifiedDomain: string;
  private verifiedEmail: string;

  constructor(apiKey: string) {
    console.log("Initializing ResendEmailService");
    
    if (!apiKey) {
      console.error("No Resend API key provided");
      throw new Error("No Resend API key provided");
    }
    
    if (apiKey.startsWith("re_") === false) {
      console.error("Invalid Resend API key format. Key should start with 're_'");
      throw new Error("Invalid Resend API key format. Key should start with 're_'");
    }
    
    console.log(`API key format validated, first 3 chars: ${apiKey.substring(0, 3)}, length: ${apiKey.length}`);
    this.resend = new Resend(apiKey);
    
    // Default verified domain
    this.verifiedDomain = "dreamplaneredu.com";
    console.log(`Default verified domain set to: ${this.verifiedDomain}`);
    
    // Save verified email as backup (for testing)
    this.verifiedEmail = Deno.env.get("VERIFIED_EMAIL") || "nicktangbusiness87@gmail.com";
    console.log(`Verified email for testing: ${this.verifiedEmail}`);
  }

  /**
   * Get domain verification status
   */
  async getDomainStatus(domain: string = "dreamplaneredu.com"): Promise<any> {
    try {
      console.log(`Checking domain status for: ${domain}`);
      
      // Try to send test email to check domain
      return await this.testApiKey(domain);
    } catch (error) {
      console.error("Failed to check domain status:", error);
      return formatErrorResponse(error, domain);
    }
  }

  /**
   * Test API key validity and domain verification
   */
  async testApiKey(domain: string = "dreamplaneredu.com"): Promise<any> {
    console.log(`Testing Resend API key with domain: ${domain}`);
    
    try {
      console.log(`Using from address for test: reminder@${domain}`);
      // Try to send a test email
      const result = await this.resend.emails.send({
        from: `College Planning <reminder@${domain}>`,
        to: this.verifiedEmail, // Send to verified email for testing
        subject: "API Key Test",
        html: "<p>This is a test email to verify the API key and domain.</p>",
        text: "This is a test email to verify the API key and domain."
      });
      
      console.log("Test email send result:", JSON.stringify(result));
      
      if (result.error) {
        console.error("Error in Resend API response:", result.error);
        return {
          error: true,
          code: result.error.code || "unknown_error",
          message: result.error.message || "Unknown error testing API key",
          details: JSON.stringify(result.error)
        };
      }
      
      return {
        success: true,
        message: "API key and domain validation successful",
        id: result.id,
        domain: domain
      };
    } catch (error) {
      console.error("Exception in testApiKey:", error);
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return formatErrorResponse(error, domain);
    }
  }

  /**
   * Send email reminder
   */
  async sendReminderEmail(to: string, subject: string, htmlContent: string, domain: string = "dreamplaneredu.com"): Promise<any> {
    try {
      console.log(`Sending email to ${to} from reminder@${domain}`);
      
      // Create full sender address
      const fromAddress = `College Planning <reminder@${domain}>`;
      console.log(`Using from address: ${fromAddress}`);
      
      const emailParams = {
        from: fromAddress,
        to: to,
        subject: subject,
        html: htmlContent,
      };
      
      console.log("Email parameters:", JSON.stringify(emailParams));
      
      const emailResult = await this.resend.emails.send(emailParams);
      
      console.log("Email sending result:", JSON.stringify(emailResult));
      
      if (emailResult.error) {
        console.error("Error in Resend response:", emailResult.error);
        return {
          error: true,
          code: emailResult.error.code || "send_failure",
          message: emailResult.error.message || "Failed to send email",
          details: JSON.stringify(emailResult.error)
        };
      }
      
      return {
        success: true,
        message: "Email sent successfully",
        id: emailResult.id
      };
    } catch (error) {
      console.error("Exception in sendReminderEmail:", error);
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return formatErrorResponse(error, domain);
    }
  }
}
