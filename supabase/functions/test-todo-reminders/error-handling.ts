
/**
 * Error handling helpers for email services
 */

/**
 * Processes domain verification errors
 */
export function handleDomainVerificationError(errorInfo: any): { code: string; message: string } | null {
  if (errorInfo.code === "from_address_not_allowed" || 
      (errorInfo.message && errorInfo.message.includes("from_address_not_allowed")) ||
      (errorInfo.error && errorInfo.error.includes("from_address_not_allowed"))) {
    return {
      code: "from_address_not_allowed",
      message: `Domain validation error: The domain is not verified in your Resend account`
    };
  }
  return null;
}

/**
 * Processes API key related errors
 */
export function handleApiKeyError(errorInfo: any): { code: string; message: string } | null {
  if (errorInfo.code === "unauthorized" || 
      (errorInfo.message && errorInfo.message.includes("unauthorized")) || 
      (errorInfo.error && errorInfo.error.includes("unauthorized")) ||
      (errorInfo.message && errorInfo.message.includes("API key"))) {
    return {
      code: "unauthorized",
      message: `API key error: The Resend API key is invalid or not authorized`
    };
  } else if (errorInfo.code === "invalid_api_key_format" || 
            (errorInfo.message && errorInfo.message.includes("Invalid API key format"))) {
    return {
      code: "invalid_api_key_format",
      message: `API key format error: Resend API key should start with 're_'`
    };
  } else if (errorInfo.code === "missing_api_key" || 
            (errorInfo.message && errorInfo.message.includes("missing"))) {
    return {
      code: "missing_api_key",
      message: `Missing API key: RESEND_API_KEY environment variable is not set`
    };
  }
  return null;
}

/**
 * Formats and processes error data
 */
export function formatErrorResponse(error: any, domain: string): any {
  console.error("Formatting error response for:", error);
  console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
  
  // Try to determine error type
  const domainError = handleDomainVerificationError(error);
  if (domainError) {
    return {
      error: true,
      code: domainError.code,
      message: domainError.message,
      domain: domain,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      time: new Date().toISOString()
    };
  }
  
  const apiKeyError = handleApiKeyError(error);
  if (apiKeyError) {
    return {
      error: true,
      code: apiKeyError.code,
      message: apiKeyError.message,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      time: new Date().toISOString()
    };
  }
  
  // Generic error
  return {
    error: true,
    code: "unknown_error",
    message: error.message || "Unknown error occurred",
    details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    time: new Date().toISOString()
  };
}
