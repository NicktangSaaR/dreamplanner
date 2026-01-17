
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { processReminderRequest } from "./handlers.ts";

/**
 * Main Edge Function handler
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // List available environment variable names (not values) for debugging
    console.log("Available environment variables:", Object.keys(Deno.env.toObject()));
    
    // Parse request body
    const requestBody = await req.json().catch((e) => {
      console.error("Failed to parse request body:", e);
      return {};
    });
    
    console.log("Request body received:", JSON.stringify(requestBody));
    
    // Process the reminder request
    const result = await processReminderRequest(requestBody);
    
    // Log the result for debugging
    console.log("Result from processReminderRequest:", JSON.stringify(result));
    
    // Determine appropriate status code
    let statusCode = 200;
    if (result?.error) {
      const errorMsg =
        typeof result.error === "string" ? result.error : JSON.stringify(result.error);
      const detailsMsg =
        typeof result.details === "string"
          ? result.details
          : JSON.stringify(result.details || "");

      // Treat Resend validation/test-mode errors as 400 to avoid crashing the UI
      const combined = `${errorMsg} ${detailsMsg}`;
      statusCode =
        combined.includes("validation_error") ||
        combined.includes("only send testing emails") ||
        combined.includes("not allowed") ||
        combined.includes("validation") ||
        combined.includes("Student ID is required")
          ? 400
          : 500;
    }
    
    // Return the response
    return new Response(
      JSON.stringify(result),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in test-todo-reminders function:", error);
    console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Format error response for better debugging
    return new Response(
      JSON.stringify({ 
        error: String(error),
        message: error.message || "Unknown error occurred",
        stack: error.stack,
        errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error))
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
