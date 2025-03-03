
import { EmailService } from "./email-interface.ts";
import { ResendEmailService } from "./resend-email-service.ts";

/**
 * Factory function to create an appropriate email service
 */
export function createEmailService(apiKey: string): EmailService {
  return new ResendEmailService(apiKey);
}
