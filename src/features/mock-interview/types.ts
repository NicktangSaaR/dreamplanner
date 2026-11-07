export type QuestionType = "video" | "written";

/** An admin-managed question bank (table mock_interview_questions). */
export interface InterviewBank {
  id: string;
  title: string;
  description: string | null;
  school: string | null;
  program: string | null;
  preparation_time: number;
  response_time: number;
  is_active: boolean;
  /** Offered as a full simulation (real-interview conditions). */
  sim_enabled: boolean;
  /** Questions drawn per simulation; null = every question in the bank. */
  sim_question_count: number | null;
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
