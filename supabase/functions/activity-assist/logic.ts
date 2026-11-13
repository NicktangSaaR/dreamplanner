// Shared by the activity-assist function and its tests.

/** Lengths kept short enough to reuse in any application form later. */
export const LIMITS = { name_en: 100, position: 100, organization: 150 } as const;

export type ActivityInput = {
  name?: string | null; role?: string | null; organization?: string | null; category?: string | null;
  description?: string | null; status?: string | null; start_date?: string | null; end_date?: string | null;
  hours_per_week?: number | null; weeks_per_year?: number | null; level?: string | null; grade_levels?: string[] | null;
};
export type Suggestion = { name_en: string; position: string; organization: string; description_en: string };

export const SYSTEM = `You help a college admissions counselor turn a student's rough notes about one activity into clear English for their records.
The notes may be in Chinese or English, short or messy. Use only facts in the input; never invent numbers, awards, titles or results. If something is unknown, leave it out.
Return JSON with these keys:
- name_en: the activity's name in English (≤${LIMITS.name_en} characters)
- position: the student's role or title (≤${LIMITS.position} characters; empty if none)
- organization: organization name in English (≤${LIMITS.organization} characters; empty if unknown)
- description_en: 2–4 sentences in English describing what the student did and any results, using active verbs and the numbers given
Keep proper nouns (competition, school, programme names) in their usual English form.`;

export function userMessage(a: ActivityInput) {
  return JSON.stringify({
    name: a.name, role: a.role, organization: a.organization, type: a.category, notes: a.description,
    status: a.status, start: a.start_date, end: a.end_date, hours_per_week: a.hours_per_week,
    weeks_per_year: a.weeks_per_year, level: a.level, grades: a.grade_levels,
  });
}

/** Cut at the last word boundary that fits. */
export function fit(text: string, max: number) {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const at = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf(";"), cut.lastIndexOf(","));
  return (at > max * 0.6 ? cut.slice(0, at) : s.slice(0, max)).replace(/[\s,;:–-]+$/, "");
}

/** Clean up the model's answer; report which fields ran over their limit before trimming. */
export function normalize(raw: Record<string, unknown>): { s: Suggestion; over: string[] } {
  const str = (k: string) => String(raw[k] ?? "").trim();
  const over: string[] = [];
  const lim = (k: keyof typeof LIMITS) => {
    const v = str(k);
    if (v.length > LIMITS[k]) over.push(k);
    return fit(v, LIMITS[k]);
  };
  return {
    s: { name_en: lim("name_en"), position: lim("position"), organization: lim("organization"), description_en: str("description_en") },
    over,
  };
}
