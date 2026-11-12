/**
 * To-dos are kept in both languages: `title` is what was typed, `title_zh` /
 * `title_en` are filled in automatically, and `title_source` is the title they
 * were made from. An edited title shows as typed until its new translation
 * arrives.
 */
export type BilingualTitle = { title: string; title_zh?: string | null; title_en?: string | null; title_source?: string | null };

export const TODO_TITLE_COLUMNS = "title, title_zh, title_en, title_source";

export function todoTitle(t: BilingualTitle, lang: string): string {
  if (t.title_source !== t.title) return t.title;
  return (lang === "en" ? t.title_en : t.title_zh) || t.title;
}
