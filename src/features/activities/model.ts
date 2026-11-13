// Activity portfolio: types, labels and the pure helpers (ordering, lists for
// each application system, what needs attention).

export type Category = "activity" | "honor" | "competition" | "research" | "work" | "volunteer" | "program";
export type Status = "planned" | "ongoing" | "ended";
export type Timing = "school" | "break" | "all_year";
export type Level = "school" | "regional" | "provincial" | "national" | "international";

export type Activity = {
  id: string;
  student_id: string;
  name: string;
  role: string | null;
  description: string | null;
  category: Category;
  status: Status;
  start_date: string | null;
  end_date: string | null;
  hours_per_week: number | null;
  weeks_per_year: number | null;
  timing: Timing | null;
  organization: string | null;
  level: Level | null;
  name_en: string | null;
  description_en: string | null;
  ca_text: string | null;
  uc_text: string | null;
  ca_type: string | null;
  uc_category: string | null;
  evidence_url: string | null;
  continue_in_college: boolean | null;
  grade_levels: string[] | null;
  sort_order: number;
  reviewed_at: string | null;
  needs_review: boolean;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
};

export const ACTIVITY_COLUMNS =
  "id, student_id, name, role, description, category, status, start_date, end_date, hours_per_week, weeks_per_year, timing, organization, level, name_en, description_en, ca_text, uc_text, ca_type, uc_category, evidence_url, continue_in_college, grade_levels, sort_order, reviewed_at, needs_review, updated_at, updated_by, created_at";

type L = { zh: string; en: string };
export const CATEGORIES: Record<Category, L> = {
  activity: { zh: "课外活动", en: "Activity" },
  honor: { zh: "荣誉奖项", en: "Honour / award" },
  competition: { zh: "竞赛", en: "Competition" },
  research: { zh: "科研项目", en: "Research" },
  work: { zh: "工作实习", en: "Work / internship" },
  volunteer: { zh: "志愿服务", en: "Volunteering" },
  program: { zh: "夏校/项目", en: "Summer / programme" },
};
export const STATUSES: Record<Status, L> = {
  planned: { zh: "计划中", en: "Planned" },
  ongoing: { zh: "进行中", en: "Ongoing" },
  ended: { zh: "已结束", en: "Ended" },
};
export const TIMINGS: Record<Timing, L> = {
  school: { zh: "上学期间", en: "During school year" },
  break: { zh: "假期", en: "During breaks" },
  all_year: { zh: "全年", en: "All year" },
};
export const LEVELS: Record<Level, L> = {
  school: { zh: "校级", en: "School" },
  regional: { zh: "市/区级", en: "City / regional" },
  provincial: { zh: "省/州级", en: "Province / state" },
  national: { zh: "国家级", en: "National" },
  international: { zh: "国际级", en: "International" },
};

export const byOrder = (a: Activity, b: Activity) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);

const MS_DAY = 86_400_000;
/** Ongoing entries untouched for 90 days, or past their end date, need updating. */
export function staleness(a: Activity, today = new Date()): "old" | "ended" | null {
  if (a.status !== "ongoing") return null;
  if (a.end_date && a.end_date < today.toISOString().slice(0, 10)) return "ended";
  if (today.getTime() - new Date(a.updated_at).getTime() > 90 * MS_DAY) return "old";
  return null;
}

/** "2025-09-01" ↔ "2025-09" for month inputs. */
export const toMonth = (d: string | null) => (d ? d.slice(0, 7) : "");
export const fromMonth = (m: string) => (m ? `${m}-01` : null);

export function period(a: Pick<Activity, "start_date" | "end_date" | "status">, lang: "zh" | "en") {
  const f = (d: string) => (lang === "zh" ? `${d.slice(0, 4)}.${Number(d.slice(5, 7))}` : `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`);
  const s = a.start_date ? f(a.start_date) : "";
  const e = a.end_date ? f(a.end_date) : a.status === "ongoing" ? (lang === "zh" ? "至今" : "present") : "";
  return s && e ? `${s} – ${e}` : s || e;
}

/** The whole list as plain text in English (falls back to the student's own words), for copying. */
export function exportText(list: Activity[]) {
  return list
    .map((a, i) => {
      const head = [a.name_en || a.name, a.role, a.organization].filter(Boolean).join(" · ");
      const meta = [
        CATEGORIES[a.category].en, STATUSES[a.status].en, period(a, "en"),
        a.hours_per_week != null ? `${a.hours_per_week} hr/wk` : "", a.weeks_per_year != null ? `${a.weeks_per_year} wk/yr` : "",
        a.timing ? TIMINGS[a.timing].en : "", a.level ? LEVELS[a.level].en : "",
        a.grade_levels?.length ? `Grades ${a.grade_levels.join(", ")}` : "",
      ].filter(Boolean).join(" · ");
      return [`${i + 1}. ${head}`, `   ${meta}`, `   ${a.description_en || a.description || "—"}`].join("\n");
    })
    .join("\n\n");
}

/** The to-do a counselor's request creates; the student page finds it by this prefix. */
export const REQUEST_PREFIX = "📋 ";
export const requestTitle = (note?: string) =>
  `${REQUEST_PREFIX}更新活动档案：把参加过的活动、比赛和奖项加进来，每条大约 1 分钟${note?.trim() ? `（${note.trim()}）` : ""}`;
export const isActivityRequest = (title: string) => title.startsWith(`${REQUEST_PREFIX}更新活动档案`);
