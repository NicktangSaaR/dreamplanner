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

// ---- turning pasted text into a list of entries ----

const CATS = ["activity", "honor", "competition", "research", "work", "volunteer", "program"] as const;

export const PARSE_PROMPT = (today: string) => `A college admissions counselor pasted rough notes about one student's activities, awards, competitions, research, work, volunteering and summer programmes (Chinese or English, any format: a résumé, a chat message, a list). Split them into separate entries.
Today is ${today}. Use only facts in the text; never invent roles, numbers, results or dates. Leave unknown fields empty.
Return JSON {"entries":[...]} in the order given, each with:
- name: the entry's name as the student would say it (keep the original language)
- name_en: the name in English
- category: one of ${CATS.join(", ")} (honor = an award or prize; competition = taking part in a contest; program = summer school or a structured programme)
- status: "ongoing", "ended" or "planned"
- start_month, end_month: "YYYY-MM" if stated or clearly implied (a school year "2024-25" starts 2024-09 and ends 2025-06), else ""
- hours_per_week, weeks_per_year: numbers if stated, else null
- role: position or title, if any
- organization: organization name, if any
- level: for awards/competition results only, one of school, regional, provincial, national, international, or ""
- description: what the student did and any results, in the original language, 1–2 sentences
- description_en: the same in English, 1–3 sentences, active verbs`;

const month = (s: unknown) => (typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s) ? `${s}-01` : null);
const num = (v: unknown, max: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
};

export type ParsedEntry = {
  name: string; name_en: string; category: string; status: "ongoing" | "ended" | "planned";
  start_date: string | null; end_date: string | null; hours_per_week: number | null; weeks_per_year: number | null;
  role: string; organization: string; level: string; description: string; description_en: string;
};

export function cleanEntries(raw: unknown): ParsedEntry[] {
  const list = Array.isArray((raw as { entries?: unknown })?.entries) ? (raw as { entries: Record<string, unknown>[] }).entries : [];
  const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
  return list.flatMap((e) => {
    const name = str(e.name, 200) || str(e.name_en, 200);
    if (!name) return [];
    const cat = str(e.category);
    const status = ["ongoing", "ended", "planned"].includes(str(e.status)) ? (str(e.status) as ParsedEntry["status"]) : "ended";
    const level = str(e.level);
    return [{
      name, name_en: str(e.name_en, LIMITS.name_en), category: (CATS as readonly string[]).includes(cat) ? cat : "activity", status,
      start_date: month(e.start_month), end_date: status === "ongoing" ? null : month(e.end_month),
      hours_per_week: num(e.hours_per_week, 168), weeks_per_year: num(e.weeks_per_year, 52),
      role: str(e.role, LIMITS.position), organization: str(e.organization, LIMITS.organization),
      level: ["school", "regional", "provincial", "national", "international"].includes(level) ? level : "",
      description: str(e.description, 2000), description_en: str(e.description_en, 2000),
    }];
  });
}
