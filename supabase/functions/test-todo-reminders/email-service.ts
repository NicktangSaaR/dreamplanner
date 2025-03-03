
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders } from "./cors.ts";

export interface EmailService {
  sendReminderEmail(to: string, subject: string, htmlContent: string, domain?: string): Promise<any>;
  testApiKey(domain: string): Promise<any>;
  getDomainStatus(domain: string): Promise<any>;
}

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
    
    // 默认已验证的域名
    this.verifiedDomain = "dreamplaneredu.com";
    console.log(`Default verified domain set to: ${this.verifiedDomain}`);
    
    // 安全地保存验证邮箱作为备用（用于测试）
    this.verifiedEmail = Deno.env.get("VERIFIED_EMAIL") || "nicktangbusiness87@gmail.com";
    console.log(`Verified email for testing: ${this.verifiedEmail}`);
  }

  // 获取域名状态
  async getDomainStatus(domain: string = "dreamplaneredu.com"): Promise<any> {
    try {
      console.log(`Checking domain status for: ${domain}`);
      
      // 尝试发送测试邮件来检查域名
      return await this.testApiKey(domain);
    } catch (error) {
      console.error("Failed to check domain status:", error);
      console.error("Error details:", JSON.stringify(error));
      
      return { 
        error: true, 
        message: `Domain ${domain} check failed: ${error.message || JSON.stringify(error)}`,
        details: JSON.stringify(error)
      };
    }
  }

  async testApiKey(domain: string = "dreamplaneredu.com"): Promise<any> {
    console.log(`Testing Resend API key with domain: ${domain}`);
    
    // 检查API密钥是否存在
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      return {
        error: true,
        code: "missing_api_key",
        message: "RESEND_API_KEY environment variable is not set"
      };
    }
    
    try {
      // 检查 API 密钥前缀
      if (!apiKey.startsWith("re_")) {
        console.error("Invalid API key format:", apiKey.substring(0, 3) + "***");
        return {
          error: true,
          code: "invalid_api_key_format",
          message: "Resend API key has incorrect format. It should start with 're_'."
        };
      }
      
      console.log(`Using from address for test: reminder@${domain}`);
      // 使用指定的验证域名
      const result = await this.resend.emails.send({
        from: `College Planning <reminder@${domain}>`,
        to: this.verifiedEmail, // 发送到验证邮箱进行测试
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
      console.error("API key validation test failed:", error);
      console.error("Error details:", JSON.stringify(error));
      
      // 解析和分类错误
      let errorCode = "unknown_error";
      let errorMessage = error.message || "Unknown error validating API key";
      
      if (typeof error === 'string') {
        if (error.includes("from_address_not_allowed")) {
          errorCode = "from_address_not_allowed";
          errorMessage = `Domain ${domain} is not verified in your Resend account`;
        } else if (error.includes("unauthorized")) {
          errorCode = "unauthorized";
          errorMessage = "Invalid API key or not authorized to use Resend API";
        }
      } else if (error.message) {
        if (error.message.includes("from_address_not_allowed")) {
          errorCode = "from_address_not_allowed";
          errorMessage = `Domain ${domain} is not verified in your Resend account`;
        } else if (error.message.includes("unauthorized")) {
          errorCode = "unauthorized";
          errorMessage = "Invalid API key or not authorized to use Resend API";
        }
      }
      
      return {
        error: true,
        code: errorCode,
        message: errorMessage,
        details: JSON.stringify(error),
        time: new Date().toISOString()
      };
    }
  }

  async sendReminderEmail(to: string, subject: string, htmlContent: string, domain: string = "dreamplaneredu.com"): Promise<any> {
    try {
      console.log(`Sending email to ${to} from reminder@${domain}`);
      
      // 首先测试 API 密钥和域名
      const testResult = await this.testApiKey(domain);
      if (testResult.error) {
        console.error("Pre-send domain validation failed:", testResult);
        return testResult;
      }
      
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
      console.error("Exception while sending email:", error);
      console.error("Error details:", JSON.stringify(error));
      
      // 解析和分类错误
      let errorCode = "unknown_error";
      let errorMessage = error.message || "Unknown error sending email";
      
      if (typeof error === 'string') {
        if (error.includes("from_address_not_allowed")) {
          errorCode = "from_address_not_allowed";
          errorMessage = `Domain ${domain} is not verified in your Resend account`;
        } else if (error.includes("unauthorized")) {
          errorCode = "unauthorized";
          errorMessage = "Invalid API key or not authorized to use Resend API";
        }
      } else if (error.message) {
        if (error.message.includes("from_address_not_allowed")) {
          errorCode = "from_address_not_allowed";
          errorMessage = `Domain ${domain} is not verified in your Resend account`;
        } else if (error.message.includes("unauthorized")) {
          errorCode = "unauthorized";
          errorMessage = "Invalid API key or not authorized to use Resend API";
        }
      }
      
      return {
        error: true,
        code: errorCode,
        message: errorMessage,
        details: JSON.stringify(error),
        time: new Date().toISOString()
      };
    }
  }
}

export function createEmailService(apiKey: string): EmailService {
  return new ResendEmailService(apiKey);
}
