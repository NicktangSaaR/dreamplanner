/**
 * Planning rules shared by the website and a future WeChat mini program.
 * Pure TypeScript only: no React, no DOM, no Supabase client.
 */

export type QuarterKey = "Q1_fall" | "Q2_winter" | "Q3_spring" | "Q4_summer";
/** `from`: the quarter it was carried over from (e.g. "Q1"); `carried`: already copied to the next quarter. */
export type Goal = { id: string; text: string; completed: boolean; from?: string; carried?: boolean };
export type Phase = "exploration" | "positioning" | "consolidation" | "application";

export const QUARTERS: { key: QuarterKey; short: string; zh: string; en: string; rangeZh: string; rangeEn: string }[] = [
  { key: "Q1_fall", short: "Q1", zh: "Q1 秋季", en: "Q1 Fall", rangeZh: "9–11 月", rangeEn: "Sep–Nov" },
  { key: "Q2_winter", short: "Q2", zh: "Q2 冬季", en: "Q2 Winter", rangeZh: "12–2 月", rangeEn: "Dec–Feb" },
  { key: "Q3_spring", short: "Q3", zh: "Q3 春季", en: "Q3 Spring", rangeZh: "3–5 月", rangeEn: "Mar–May" },
  { key: "Q4_summer", short: "Q4", zh: "Q4 夏季", en: "Q4 Summer", rangeZh: "6–8 月", rangeEn: "Jun–Aug" },
];

export const PHASES: Phase[] = ["exploration", "positioning", "consolidation", "application"];

export function academicYear(d = new Date()) {
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

export function currentQuarter(d = new Date()): QuarterKey {
  const m = d.getMonth();
  if (m >= 8 && m <= 10) return "Q1_fall";
  if (m >= 11 || m <= 1) return "Q2_winter";
  if (m >= 2 && m <= 4) return "Q3_spring";
  return "Q4_summer";
}

/** Last day of the current quarter. */
export function quarterEnd(d = new Date()): Date {
  const q = currentQuarter(d);
  const y = d.getFullYear();
  if (q === "Q1_fall") return new Date(y, 10, 30);
  if (q === "Q2_winter") return new Date(d.getMonth() === 11 ? y + 1 : y, 2, 0); // last day of Feb
  if (q === "Q3_spring") return new Date(y, 4, 31);
  return new Date(y, 7, 31);
}

/** First and last day (YYYY-MM-DD) of a quarter in an academic year like "2026-2027". */
export function quarterRange(q: QuarterKey, year: string): { from: string; to: string } {
  const y = Number(year.slice(0, 4));
  const lastFeb = new Date(y + 1, 2, 0).getDate();
  if (q === "Q1_fall") return { from: `${y}-09-01`, to: `${y}-11-30` };
  if (q === "Q2_winter") return { from: `${y}-12-01`, to: `${y + 1}-02-${lastFeb}` };
  if (q === "Q3_spring") return { from: `${y + 1}-03-01`, to: `${y + 1}-05-31` };
  return { from: `${y + 1}-06-01`, to: `${y + 1}-08-31` };
}

export function nextQuarter(q: QuarterKey, year: string): { quarter: QuarterKey; year: string } {
  const i = QUARTERS.findIndex((x) => x.key === q);
  if (i < QUARTERS.length - 1) return { quarter: QUARTERS[i + 1].key, year };
  const start = Number(year.slice(0, 4)) + 1;
  return { quarter: "Q1_fall", year: `${start}-${start + 1}` };
}

export function previousQuarter(q: QuarterKey, year: string): { quarter: QuarterKey; year: string } {
  const i = QUARTERS.findIndex((x) => x.key === q);
  if (i > 0) return { quarter: QUARTERS[i - 1].key, year };
  const start = Number(year.slice(0, 4)) - 1;
  return { quarter: "Q4_summer", year: `${start}-${start + 1}` };
}

export function parseGoals(raw: string | null | undefined): Goal[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((g) => g && typeof g.text === "string")
        .map((g, i) => ({
          id: String(g.id ?? `kpi-${i}`), text: g.text, completed: !!g.completed,
          ...(typeof g.from === "string" ? { from: g.from } : {}), ...(g.carried ? { carried: true } : {}),
        }));
    }
  } catch {
    /* plain text below */
  }
  return raw
    .split("\n")
    .map((l) => l.replace(/^[•\-\d.、\s]+/, "").trim())
    .filter(Boolean)
    .map((text, i) => ({ id: `kpi-line-${i}`, text, completed: false }));
}

export const newGoalId = () => `kpi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const fmtDate = (iso: string | null | undefined, lang: string) =>
  iso ? new Date(iso).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-CA") : "";

/** Today as YYYY-MM-DD in local time. */
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Goals saved as JSON can be ticked; old plain-text goals are read-only. */
export function goalsAreTickable(raw: string | null | undefined): boolean {
  if (!raw) return true;
  try {
    return Array.isArray(JSON.parse(raw));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- graduate track

export type ApplicantType = "undergrad" | "graduate";
export type GradPhase = "grad_positioning" | "grad_background" | "grad_materials" | "grad_application" | "grad_admission";
export type GradStatus = "year1" | "year2" | "year3" | "year4" | "graduated" | "masters";
export type GradDegree = "masters" | "mba";
export type EntryTerm = "fall" | "spring";

export const GRAD_PHASES: GradPhase[] = ["grad_positioning", "grad_background", "grad_materials", "grad_application", "grad_admission"];
export const GRAD_STATUSES: GradStatus[] = ["year1", "year2", "year3", "year4", "graduated", "masters"];

export const GRAD_STATUS_LABEL: Record<GradStatus, { zh: string; en: string }> = {
  year1: { zh: "大一", en: "Undergrad year 1" },
  year2: { zh: "大二", en: "Undergrad year 2" },
  year3: { zh: "大三", en: "Undergrad year 3" },
  year4: { zh: "大四", en: "Undergrad year 4" },
  graduated: { zh: "已毕业（工作中）", en: "Graduated, working" },
  masters: { zh: "在读硕士", en: "In a master's program" },
};
export const GRAD_DEGREE_LABEL: Record<GradDegree, { zh: string; en: string }> = {
  masters: { zh: "硕士", en: "Master's" },
  mba: { zh: "MBA", en: "MBA" },
};
export const entryLabel = (term: EntryTerm | null | undefined, year: number | null | undefined, lang: string) =>
  year ? (lang === "zh" ? `${year} ${term === "spring" ? "春季" : "秋季"}入学` : `${term === "spring" ? "Spring" : "Fall"} ${year} entry`) : "";

const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());

/** First day of the target term (fall = Sep 1, spring = Jan 1). */
export const entryDate = (term: EntryTerm | null | undefined, year: number) => new Date(year, term === "spring" ? 0 : 8, 1);

/**
 * Graduate timeline, counting back from entry (same rule as the database's
 * grad_phase_for): 录取 from 8 months before entry, 申请 from 12, 材料准备 from
 * 16; 定位 for the first 2 months after starting, then 背景提升.
 */
export function gradTimeline(term: EntryTerm | null | undefined, year: number, start: Date) {
  const entry = entryDate(term, year);
  const materials = addMonths(entry, -16);
  const positioningEnd = new Date(Math.min(addMonths(start, 2).getTime(), materials.getTime()));
  const bounds: { phase: GradPhase; from: Date; to: Date }[] = [
    { phase: "grad_positioning", from: start, to: positioningEnd },
    { phase: "grad_background", from: positioningEnd, to: materials },
    { phase: "grad_materials", from: materials, to: addMonths(entry, -12) },
    { phase: "grad_application", from: addMonths(entry, -12), to: addMonths(entry, -8) },
    { phase: "grad_admission", from: addMonths(entry, -8), to: entry },
  ];
  // Stages that are already over before the student started have no room.
  return bounds.map((b) => ({ ...b, skipped: b.to.getTime() <= start.getTime() }));
}

export function gradPhaseOn(term: EntryTerm | null | undefined, year: number | null | undefined, start: Date, on = new Date()): GradPhase {
  if (!year) return "grad_positioning";
  const tl = gradTimeline(term, year, start);
  for (let i = tl.length - 1; i >= 0; i--) if (on.getTime() >= tl[i].from.getTime()) return tl[i].phase;
  return "grad_positioning";
}

export type Track = {
  applicantType: ApplicantType;
  gradStatus?: GradStatus | null;
  gradDegree?: GradDegree | null;
  entryTerm?: EntryTerm | null;
  entryYear?: number | null;
  start?: string | null; // when the student joined (ISO)
};

/** "研究生 · MBA · 大三 · 2028 秋季入学" */
export function gradSummary(t: Track, lang: string): string {
  const L = (x: { zh: string; en: string }) => (lang === "zh" ? x.zh : x.en);
  return [
    lang === "zh" ? "研究生" : "Graduate",
    t.gradDegree ? L(GRAD_DEGREE_LABEL[t.gradDegree]) : "",
    t.gradStatus ? L(GRAD_STATUS_LABEL[t.gradStatus]) : "",
    entryLabel(t.entryTerm, t.entryYear, lang),
  ].filter(Boolean).join(" · ");
}

/** Which colour card a student gets: undergraduate, transfer or graduate. */
export type StudentKind = "undergrad" | "transfer" | "graduate";
export function studentKind(p: { applicant_type?: string | null; status?: string | null; grade?: string | null } | null | undefined): StudentKind {
  if (p?.applicant_type === "graduate" || p?.status === "Graduate") return "graduate";
  if (p?.status === "Transfer Student" || p?.grade === "Transfer") return "transfer";
  return "undergrad";
}
export const STUDENT_KIND_LABEL: Record<StudentKind, { zh: string; en: string }> = {
  undergrad: { zh: "本科", en: "Undergraduate" },
  transfer: { zh: "转学", en: "Transfer" },
  graduate: { zh: "研究生", en: "Graduate" },
};

/**
 * Turn AI goal output into one goal per item. Handles arrays, one goal per
 * line, and a single paragraph numbered inline ("1）… 2）… 3)…", "①…②…").
 */
export function splitGoalText(raw: unknown): string[] {
  const parts: string[] = Array.isArray(raw)
    ? raw.map((k) => (typeof k === "string" ? k : (k as { text?: string; title?: string })?.text || (k as { title?: string })?.title || ""))
    : typeof raw === "string" ? [raw] : [];
  return parts
    .flatMap((p) =>
      p
        // a number marker at the start or after a space / punctuation: 1） 2) (3) 4、 5. — but not 3.8
        .replace(/(^|[\s；;，,。])[（(]?\d{1,2}(?:[)）、]|\.(?!\d))/g, "$1\n")
        .replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, "\n")
        .split("\n"),
    )
    .map((l) => l.replace(/^[\s•\-–—*）)]+/, "").replace(/[；;，,\s]+$/, "").trim())
    .filter((l) => l.length > 1);
}
