import { parsePastedQuestions, type QuestionType } from "./types";

/** Per-question settings read from a spreadsheet column (all optional). */
export interface QuestionMeta {
  type?: QuestionType;
  prep?: number;
  response?: number;
}

export interface ImportedFile {
  titles: string[];
  /** Keyed by question title. Only filled when the file had type/time columns. */
  meta: Record<string, QuestionMeta>;
}

export const ACCEPTED_QUESTION_FILES = ".txt,.md,.csv,.tsv,.xlsx,.xls";

const HEADER_ALIASES = {
  title: ["question", "questions", "title", "prompt", "题目", "问题", "面试题", "题干"],
  type: ["type", "question type", "题型", "类型"],
  prep: ["prep", "preparation", "prep time", "preparation time", "准备", "准备时间", "准备时间(秒)", "准备时间（秒）"],
  response: ["response", "answer", "response time", "answer time", "答题", "作答", "答题时间", "答题时间(秒)", "答题时间（秒）", "回答时间", "回答时间(秒)", "回答时间（秒）"],
} as const;

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

function matchHeader(cell: string): keyof typeof HEADER_ALIASES | null {
  const c = norm(cell).replace(/\s+/g, " ");
  for (const key of Object.keys(HEADER_ALIASES) as (keyof typeof HEADER_ALIASES)[]) {
    if ((HEADER_ALIASES[key] as readonly string[]).some((a) => c === a || c.startsWith(a + " ") || c.startsWith(a + "("))) return key;
  }
  return null;
}

export function parseType(v: unknown): QuestionType | undefined {
  const s = norm(v);
  if (!s) return undefined;
  if (/written|text|书面|文字|文本|笔试/.test(s)) return "written";
  if (/video|oral|视频|口语|口头|录像/.test(s)) return "video";
  return undefined;
}

/** "90", "90s", "90秒", "2m", "2分钟", "1:30" → seconds. */
export function parseSeconds(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return clampTime(Math.round(v));
  const s = norm(v);
  if (!s) return undefined;
  const mmss = s.match(/^(\d+):(\d{1,2})$/);
  if (mmss) return clampTime(Number(mmss[1]) * 60 + Number(mmss[2]));
  const num = s.match(/^(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds?|秒|m|min|mins|minutes?|分|分钟)?$/);
  if (!num) return undefined;
  const n = Number(num[1]);
  const unit = num[2] || "s";
  return clampTime(Math.round(/^(m|min|分)/.test(unit) ? n * 60 : n));
}

const clampTime = (n: number) => (n >= 0 && n <= 1800 ? n : undefined);

/** Turn spreadsheet rows into questions, using a header row when one is present. */
export function rowsToQuestions(rows: unknown[][]): ImportedFile {
  const titles: string[] = [];
  const meta: Record<string, QuestionMeta> = {};
  const headerIdx = rows.findIndex((r) => r.some((c) => matchHeader(String(c ?? "")) === "title"));

  if (headerIdx === -1) {
    // No header: every row is one question, taken from its first non-empty cell.
    for (const r of rows) {
      const cell = r.find((c) => String(c ?? "").trim() !== "");
      if (cell !== undefined) titles.push(...parsePastedQuestions(String(cell)));
    }
    return { titles, meta };
  }

  const cols: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};
  rows[headerIdx].forEach((c, i) => {
    const k = matchHeader(String(c ?? ""));
    if (k && cols[k] === undefined) cols[k] = i;
  });

  for (const r of rows.slice(headerIdx + 1)) {
    const [title] = parsePastedQuestions(String(r[cols.title!] ?? ""));
    if (!title) continue;
    titles.push(title);
    const m: QuestionMeta = {
      type: cols.type !== undefined ? parseType(r[cols.type]) : undefined,
      prep: cols.prep !== undefined ? parseSeconds(r[cols.prep]) : undefined,
      response: cols.response !== undefined ? parseSeconds(r[cols.response]) : undefined,
    };
    if (m.type || m.prep !== undefined || m.response !== undefined) meta[title] = m;
  }
  return { titles, meta };
}

/** Read a .txt / .csv / .xlsx file into a list of questions. */
export async function readQuestionFile(file: File): Promise<ImportedFile> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return { titles: parsePastedQuestions(await file.text()), meta: {} };
  }
  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const wb = name.endsWith(".csv") || name.endsWith(".tsv")
      ? XLSX.read(await file.text(), { type: "string" })
      : XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: "" });
    return rowsToQuestions(rows);
  }
  throw new Error("UNSUPPORTED");
}

/** Download a CSV template that opens cleanly in Excel (UTF-8 with BOM). */
export function downloadQuestionTemplate(lang: "zh" | "en") {
  const rows = lang === "zh"
    ? [["题目", "题型", "准备时间(秒)", "回答时间(秒)"],
       ["Tell us about yourself.", "视频", "30", "60"],
       ["Why do you want to study {program} at {school}?", "视频", "30", "90"],
       ["Describe a challenge you overcame in 150 words.", "书面", "60", "300"]]
    : [["Question", "Type", "Prep (seconds)", "Response (seconds)"],
       ["Tell us about yourself.", "video", "30", "60"],
       ["Why do you want to study {program} at {school}?", "video", "30", "90"],
       ["Describe a challenge you overcame in 150 words.", "written", "60", "300"]];
  const csv = rows.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = lang === "zh" ? "面试题目模板.csv" : "interview-questions-template.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Drop blank lines, duplicates within the batch, and titles that already exist. */
export function dedupeTitles(titles: string[], existing: string[]): { fresh: string[]; skipped: number } {
  const seen = new Set(existing.map((t) => t.trim().toLowerCase()));
  const fresh: string[] = [];
  for (const t of titles) {
    const k = t.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    fresh.push(t);
  }
  return { fresh, skipped: titles.length - fresh.length };
}
