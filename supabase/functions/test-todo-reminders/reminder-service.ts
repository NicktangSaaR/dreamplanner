
import { createDatabaseService } from "./db-service.ts";
import { EmailManager } from "./email-manager.ts";
import { formatErrorResponse } from "./error-handling.ts";

/**
 * Core service that orchestrates the reminder process
 */
export class ReminderService {
  private dbService;
  private emailManager;
  private domain: string;
  
  constructor(supabaseUrl: string, supabaseKey: string, resendApiKey: string, domain: string = "dreamplaneredu.com") {
    this.dbService = createDatabaseService(supabaseUrl, supabaseKey);
    this.emailManager = new EmailManager(resendApiKey, domain);
    this.domain = domain;
  }
  
  /**
   * Process reminder for a specific student
   * @param studentId - The student's ID
   * @param customEmail - Optional custom email to send to instead of student/counselor emails
   */
  async processReminder(studentId: string, customEmail?: string) {
    try {
      // Get todos
      console.log("Fetching uncompleted todos for student:", studentId);
      const todos = await this.dbService.getUncompletedTodos(studentId);
      
      if (!todos || todos.length === 0) {
        console.log("No uncompleted todos found for student:", studentId);
        return { message: "No uncompleted todos to remind about" };
      }
      
      console.log(`Found ${todos.length} uncompleted todos for student:`, studentId);
      
      // Get student information
      const studentInfo = todos.length > 0 ? todos[0].profiles : null;
      
      // Log student email information for debugging
      console.log("Student email:", studentInfo?.email);
      
      // If customEmail is provided, send only to that email
      if (customEmail) {
        console.log("Custom email provided, sending to:", customEmail);
        return await this.emailManager.sendCustomEmail(todos, studentInfo, customEmail);
      }
      
      // Get the counselor information for the student
      console.log("Fetching counselor for student:", studentId);
      const counselorInfo = await this.dbService.getCounselorForStudent(studentId);
      console.log("Counselor email:", counselorInfo?.email);
      
      // Send emails to student and counselor
      return await this.emailManager.sendReminderEmails(todos, studentInfo, counselorInfo);
    } catch (error) {
      console.error("Error in processReminder:", error);
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return formatErrorResponse(error, this.domain);
    }
  }
}
