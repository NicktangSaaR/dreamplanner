export type QuestionType = "video" | "written";

export type BankKind = "pool" | "school";

/** One part of a school interview: draw `count` questions from a shared pool. */
export interface BlueprintSection {
  pool_id: string;
  count: number;
  /** null = keep each question's own type */
  question_type: QuestionType | null;
  prep: number; // seconds
  response: number; // seconds
}

/**
 * A row of mock_interview_questions.
 *  - kind "pool":   a shared question category; its questions are in mock_interview_bank_questions.
 *  - kind "school": a university/program interview built from pools by its blueprint.
 */
export interface InterviewBank {
  id: string;
  kind: BankKind;
  title: string;
  description: string | null;
  school: string | null;
  program: string | null;
  preparation_time: number;
  response_time: number;
  is_active: boolean;
  blueprint: BlueprintSection[];
  /** School interviews: shuffle the drawn questions instead of keeping section order. */
  sim_shuffle: boolean;
  sim_retakes: number;
  created_at: string;
}

/** A question inside a bank (table mock_interview_bank_questions). */
export interface BankQuestion {
  id: string;
  bank_id: string;
  title: string;
  description: string | null;
  question_type: QuestionType;
  preparation_time: number | null;
  response_time: number | null;
  sort_order: number;
}

/** A student's own question (table mock_interview_custom_questions). */
export interface CustomQuestion {
  id: string;
  user_id: string;
  title: string;
  question_type: QuestionType;
  preparation_time: number;
  response_time: number;
  created_at: string;
}

/** A question as it is asked during a session, whatever its source. */
export interface SessionQuestion {
  key: string; // "bank:<id>" or "custom:<id>"
  text: string;
  type: QuestionType;
  prep: number; // seconds
  response: number; // seconds
}

export interface SessionSettings {
  school: string;
  program: string;
  retakes: number; // 99 = unlimited
  shuffle: boolean;
}

export interface Answer {
  question: SessionQuestion;
  videoUrl?: string; // object URL of the recording, kept in this browser only
  videoMime?: string;
  written?: string;
  attemptsUsed: number;
}

export const PREP_OPTIONS = [0, 15, 30, 45, 60, 90, 120, 180, 300];
export const RESPONSE_OPTIONS = [30, 45, 60, 90, 120, 180, 240, 300, 600];

export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.round(total));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** Replace {school} and {program} placeholders in question text. */
export function fillPlaceholders(text: string, school: string, program: string): string {
  return text
    .split("{school}").join(school || "your chosen school")
    .split("{program}").join(program || "this program");
}

/**
 * Parse pasted text into questions: one question per non-empty line.
 * Leading list markers such as "1.", "1)", "-", "•" are removed.
 */
export function parsePastedQuestions(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•·]|\d+[.)、]|[（(]\d+[)）])\s*/, "").trim())
    .filter((line) => line.length > 0)
    .map((line) => line.slice(0, 1000));
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffled<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Total questions a blueprint asks for. */
export const blueprintTotal = (b: BlueprintSection[]) => b.reduce((n, s) => n + s.count, 0);

/** Estimated length of a blueprint, in seconds. */
export const blueprintSeconds = (b: BlueprintSection[]) => b.reduce((n, s) => n + s.count * (s.prep + s.response), 0);

const RECENT_KEY = "dreamplanner.mi.recent";
const RECENT_MAX = 80;

/** Question keys this browser drew recently (most recent last). Never throws. */
export function recentQuestionKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Remember the questions of a run so the next runs prefer different ones. */
export function rememberQuestions(keys: string[]) {
  try {
    const list = [...recentQuestionKeys()].filter((k) => !keys.includes(k)).concat(keys);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(-RECENT_MAX)));
  } catch {
    /* storage unavailable: drawing still works, just without the preference */
  }
}

const sameText = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Random order, but questions not seen recently come first, so repeated
 * runs cycle through a pool before showing the same question again.
 */
export function freshFirst<T extends { key: string }>(list: T[], recent: Set<string>): T[] {
  const mixed = shuffled(list);
  return [...mixed.filter((q) => !recent.has(q.key)), ...mixed.filter((q) => recent.has(q.key))];
}

/**
 * Build a school interview: for each section, draw random questions from its
 * pool. A question is never used twice in one interview, even when several
 * sections draw from the same pool or the same text sits in two pools.
 */
export function drawFromBlueprint(
  school: InterviewBank,
  questionsByPool: Record<string, BankQuestion[]>,
  recent: Set<string> = new Set(),
): SessionQuestion[] {
  const usedIds = new Set<string>();
  const usedTexts = new Set<string>();
  const out: SessionQuestion[] = [];
  for (const sec of school.blueprint) {
    const pool = (questionsByPool[sec.pool_id] ?? []).map((q) => ({ ...q, key: `bank:${q.id}` }));
    let taken = 0;
    for (const q of freshFirst(pool, recent)) {
      if (taken >= sec.count) break;
      const text = sameText(q.title);
      if (usedIds.has(q.id) || usedTexts.has(text)) continue;
      usedIds.add(q.id);
      usedTexts.add(text);
      taken++;
      out.push({
        key: q.key,
        text: q.title,
        type: sec.question_type ?? q.question_type,
        prep: sec.prep,
        response: sec.response,
      });
    }
  }
  return school.sim_shuffle ? shuffled(out) : out;
}

/** Random practice set: no repeated text, recently seen questions last. */
export function drawRandom(list: SessionQuestion[], n: number, recent: Set<string> = new Set()): SessionQuestion[] {
  const seen = new Set<string>();
  const out: SessionQuestion[] = [];
  for (const q of freshFirst(list, recent)) {
    if (out.length >= n) break;
    const text = sameText(q.text);
    if (seen.has(text)) continue;
    seen.add(text);
    out.push(q);
  }
  return out;
}

/** How many questions a blueprint can actually draw with the pools as they are now. */
export function blueprintAvailable(school: InterviewBank, questionsByPool: Record<string, BankQuestion[]>): number {
  const asked: Record<string, number> = {};
  for (const s of school.blueprint) asked[s.pool_id] = (asked[s.pool_id] ?? 0) + s.count;
  return Object.entries(asked).reduce((n, [pool, want]) => n + Math.min(want, questionsByPool[pool]?.length ?? 0), 0);
}
