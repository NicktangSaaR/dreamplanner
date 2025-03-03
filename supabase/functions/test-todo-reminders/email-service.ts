
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders } from "./cors.ts";

export interface EmailService {
  sendReminderEmail(to: string, subject: string, htmlContent: string, domain?: string): Promise<any>;
  testApiKey(domain: string): Promise<any>;
}

export class ResendEmailService implements EmailService {
  private resend: Resend;
  private verifiedDomain: string;
  private verifiedEmail: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("No Resend API key provided");
    }
    this.resend = new Resend(apiKey);
    // 默认已验证的域名
    this.verifiedDomain = "dreamplaneredu.com";
    // 安全地保存验证邮箱作为备用（用于测试）
    this.verifiedEmail = Deno.env.get("VERIFIED_EMAIL") || "nicktangbusiness87@gmail.com";
  }

  async testApiKey(domain: string = "dreamplaneredu.com"): Promise<any> {
    console.log(`Testing Resend API key with domain: ${domain}`);
    
    try {
      // 使用指定的验证域名
      const result = await this.resend.emails.send({
        from: `College Planning <reminder@${domain}>`,
        to: this.verifiedEmail, // 发送到验证邮箱进行测试
        subject: "API Key Test",
        html: "<p>This is a test email to verify the API key and domain.</p>",
        text: "This is a test email to verify the API key and domain."
      });
      
      console.log("Test email sent successfully:", JSON.stringify(result));
      return result;
    } catch (error) {
      console.error("API key validation test failed:", error);
      console.error("Error details:", JSON.stringify(error));
      throw error;
    }
  }

  async sendReminderEmail(to: string, subject: string, htmlContent: string, domain: string = "dreamplaneredu.com"): Promise<any> {
    try {
      console.log(`Sending email to ${to} from reminder@${domain}`);
      
      // 显式创建完整的发件人地址
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
        throw new Error(JSON.stringify(emailResult.error));
      }
      
      return emailResult;
    } catch (error) {
      console.error("Exception while sending email:", error);
      console.error("Error details:", JSON.stringify(error));
      throw error;
    }
  }
}

export function createEmailService(apiKey: string): EmailService {
  return new ResendEmailService(apiKey);
}
