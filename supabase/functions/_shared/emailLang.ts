// Which language(s) an email is written in, from profiles.email_language.
// Unset means both, English first (some students can't read Chinese).

export type EmailLang = "zh" | "en" | "both";

export const emailLang = (v: unknown): EmailLang => (v === "zh" || v === "en" ? v : "both");

/** The parts to include, in reading order. */
export function inOrder<T>(lang: EmailLang, zh: T, en: T): T[] {
  return lang === "zh" ? [zh] : lang === "en" ? [en] : [en, zh];
}

/** A subject line in the reader's language(s), English first when both. */
export function subjectFor(lang: EmailLang, zh: string, en: string): string {
  return inOrder(lang, zh, en).join(" · ");
}
