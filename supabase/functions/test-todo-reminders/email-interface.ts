
/**
 * Interface for email service implementations
 */
export interface EmailService {
  sendReminderEmail(to: string, subject: string, htmlContent: string, domain?: string): Promise<any>;
  testApiKey(domain: string): Promise<any>;
  getDomainStatus(domain: string): Promise<any>;
}
