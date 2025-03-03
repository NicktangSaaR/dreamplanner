
import { validateRequestParams, validateResendApiKey, validateSupabaseConfig } from "./validators.ts";
import { ReminderService } from "./reminder-service.ts";
import { formatErrorResponse } from "./error-handling.ts";

/**
 * Handles the reminder request processing
 */
export async function processReminderRequest(requestBody: any) {
  // Validate request parameters
  const validationResult = validateRequestParams(requestBody);
  if (!validationResult.isValid) {
    return validationResult;
  }
  
  const { studentId, debug, domain } = validationResult;
  console.log("Request received with studentId:", studentId, "debug mode:", debug, "domain:", domain);
  
  // Validate Resend API key
  const apiKeyValidation = validateResendApiKey();
  if (!apiKeyValidation.isValid) {
    return apiKeyValidation;
  }
  
  // Validate Supabase configuration
  const supabaseConfigValidation = validateSupabaseConfig();
  if (!supabaseConfigValidation.isValid) {
    return supabaseConfigValidation;
  }
  
  // Initialize services
  try {
    console.log("Creating reminder service with validated configuration");
    const reminderService = new ReminderService(
      supabaseConfigValidation.supabaseUrl,
      supabaseConfigValidation.supabaseKey,
      apiKeyValidation.resendApiKey,
      domain
    );
    
    console.log("Services initialized successfully, processing reminder");
    return await reminderService.processReminder(studentId);
  } catch (initError) {
    console.error("Failed to initialize services:", initError);
    console.error("Error details:", JSON.stringify(initError, Object.getOwnPropertyNames(initError)));
    return { 
      error: "Failed to initialize services", 
      details: String(initError) 
    };
  }
}
