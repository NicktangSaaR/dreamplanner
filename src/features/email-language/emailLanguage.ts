import { supabase } from "@/integrations/supabase/client";

/** Language for emails to a person; null in the database means both, English first. */
export type EmailLanguage = "en" | "zh" | "both";
export const EMAIL_LANGUAGES: EmailLanguage[] = ["both", "en", "zh"];

export const emailLanguageLabel = (v: EmailLanguage, ui: "zh" | "en") =>
  ({
    both: ui === "zh" ? "中英双语（英文在前）" : "English and Chinese (English first)",
    en: ui === "zh" ? "只用英文" : "English only",
    zh: ui === "zh" ? "只用中文" : "Chinese only",
  })[v];

export const toEmailLanguage = (v: unknown): EmailLanguage => (v === "en" || v === "zh" ? v : "both");

/** Save for a profile; returns false if nothing was saved (no permission). */
export async function saveEmailLanguage(userId: string, value: EmailLanguage) {
  const { data, error } = await (supabase as any)
    .from("profiles").update({ email_language: value }).eq("id", userId).select("id");
  return !error && !!data?.length;
}
