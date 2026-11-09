import { supabase } from "@/integrations/supabase/client";
import type { Answer, SessionQuestion } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** How a run was started, for the record the counselor sees. */
export type SessionMeta = { mode: "simulation" | "practice"; title: string };

export type LoggedQuestion = { key: string; text: string; type: string; answered: boolean; attempts: number };

const summarize = (questions: SessionQuestion[], answers: Answer[]): LoggedQuestion[] =>
  questions.map((q) => {
    const a = answers.find((x) => x.question.key === q.key);
    return { key: q.key, text: q.text, type: q.type, answered: !!a && a.attemptsUsed > 0, attempts: a?.attemptsUsed ?? 0 };
  });

/**
 * Best effort: practice must never be blocked by a failed write, so errors
 * are swallowed. Recordings are not uploaded; only which questions were
 * drawn and answered.
 */
export async function startSession(meta: SessionMeta, questions: SessionQuestion[]): Promise<string | null> {
  try {
    const { data, error } = await db
      .from("mock_interview_sessions")
      .insert({ mode: meta.mode, title: meta.title, questions: summarize(questions, []), total: questions.length, answered: 0 })
      .select("id")
      .single();
    if (error) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

export async function updateSession(id: string | null, questions: SessionQuestion[], answers: Answer[], status?: "completed" | "exited") {
  if (!id) return;
  const list = summarize(questions, answers);
  try {
    await db
      .from("mock_interview_sessions")
      .update({
        questions: list,
        answered: list.filter((q) => q.answered).length,
        ...(status ? { status, finished_at: new Date().toISOString() } : {}),
      })
      .eq("id", id);
  } catch {
    /* not recorded; practice continues */
  }
}
