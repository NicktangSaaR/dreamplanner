// Messages shown when a reminder email can't be sent. Counselors see plain
// words; the technical detail goes to the browser console for whoever fixes it.

const TRY_AGAIN = "提醒邮件没能发出，请稍后再试。如果一直不行，请联系网站管理员。";
const ADMIN = "提醒邮件没能发出：网站的邮件服务需要管理员检查设置。请联系网站管理员。";

/** Processes errors from calling the reminder function. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleInvokeError = (error: any): string => {
  console.error("Error sending reminder (invoke error):", error);
  console.error("Error details:", JSON.stringify(error));
  if (error?.isConnectionError || error?.name === "FunctionsFetchError") {
    console.error("Could not reach the reminder edge function (project paused, network, or not deployed).");
  } else if (typeof error?.message === "string" && error.message.includes("non-2xx")) {
    console.error("The reminder edge function returned an error; check its logs and the Resend API key / domain.");
  }
  return TRY_AGAIN;
};

/** Sender domain not verified with the email provider (Resend). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleDomainVerificationError = (errorInfo: any): string => {
  if (errorInfo.code === "from_address_not_allowed" ||
      (errorInfo.message && errorInfo.message.includes("from_address_not_allowed")) ||
      (errorInfo.error && errorInfo.error.includes("from_address_not_allowed"))) {
    console.error("dreamplaneredu.com is not verified with Resend.");
    return ADMIN;
  }
  return "";
};

/** Missing or wrong email-provider API key. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleApiKeyError = (errorInfo: any): string => {
  const text = `${errorInfo.message ?? ""} ${errorInfo.error ?? ""}`;
  if (errorInfo.code === "unauthorized" || text.includes("unauthorized") || text.includes("API key") ||
      errorInfo.code === "invalid_api_key_format" || text.includes("Invalid API key format") ||
      errorInfo.code === "missing_api_key" || text.includes("missing")) {
    console.error("Reminder email API key problem:", errorInfo);
    return ADMIN;
  }
  return "";
};
