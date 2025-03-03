
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
    if (result.error) {
      statusCode = result.error.includes("not allowed") || 
                  result.error.includes("validation") || 
                  result.error.includes("Student ID is required") ? 
                  400 : 500;
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
