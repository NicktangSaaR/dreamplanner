/**
 * Planning rules shared by the website and a future WeChat mini program.
 * Pure TypeScript only: no React, no DOM, no Supabase client.
 */

export type QuarterKey = "Q1_fall" | "Q2_winter" | "Q3_spring" | "Q4_summer";
export type Goal = { id: string; text: string; completed: boolean };
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
        .map((g, i) => ({ id: String(g.id ?? `kpi-${i}`), text: g.text, completed: !!g.completed }));
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
