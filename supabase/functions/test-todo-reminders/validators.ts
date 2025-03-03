
/**
 * Validates and processes the incoming request parameters
 */
export function validateRequestParams(requestBody: any) {
  const { studentId, debug, domain = "dreamplaneredu.com" } = requestBody;
  
  if (!studentId) {
    return { 
      isValid: false,
      error: "Student ID is required",
      details: "Please provide a valid student ID"
    };
  }
  
  return {
    isValid: true,
    studentId,
    debug,
    domain
  };
}

/**
 * Validates Supabase environment variables
 */
export function validateSupabaseConfig() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
    
    // List all environment variables names (without values) for debugging
    const envVars = Object.keys(Deno.env.toObject());
    
    return { 
      isValid: false,
      error: "Supabase configuration is missing",
      availableEnvVars: envVars 
    };
  }
  
  return {
    isValid: true,
    supabaseUrl,
    supabaseKey
  };
}

/**
 * Validates Resend API key
 */
export function validateResendApiKey() {
  // List all environment variables names for debugging
  const envVars = Object.keys(Deno.env.toObject());
  console.log("Available environment variables:", envVars);
  
  // Try multiple possible environment variable names for the Resend API key
  const possibleNames = ["RESEND_API_KEY", "Remind API", "REMIND_API"];
  let resendApiKey: string | null = null;
  
  for (const name of possibleNames) {
    const value = Deno.env.get(name);
    if (value) {
      console.log(`Found API key in environment variable: ${name}`);
      resendApiKey = value;
      break;
    }
  }
  
  if (!resendApiKey) {
    console.error("Resend API key not found in any of the expected environment variables");
    return { 
      isValid: false,
      error: "Email service configuration is missing", 
      details: "Resend API key not found. Please add it to your Supabase Edge Function secrets with name 'RESEND_API_KEY'.",
      availableEnvVars: envVars
    };
  }
  
  // Safely validate API key format (without outputting the full key)
  console.log(`Found API key with prefix: ${resendApiKey.substring(0, 3)}***`);
  console.log(`API key length: ${resendApiKey.length} characters`);
  
  // Check for correct prefix for Resend API keys
  if (!resendApiKey.startsWith("re_")) {
    console.error("API key has incorrect format. Resend API keys should start with 're_'");
    return { 
      isValid: false,
      error: "API key has incorrect format", 
      details: "Resend API keys should start with 're_'. Please check your Supabase Edge Function secrets.",
      availableEnvVars: envVars
    };
  }
  
  return {
    isValid: true,
    resendApiKey
  };
}
