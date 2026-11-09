/**
 * Student-side data access, shared by the website and a future WeChat mini
 * program. Every function takes the Supabase client as its first argument,
 * so each platform passes its own (the mini program would pass one whose
 * network and storage use the wx.* APIs). No React, no DOM.
 *
 * Row-level security on the database decides what a student may see and
 * change; these functions never rely on the caller to filter.
 */
import { parseGoals, type Goal, type QuarterKey } from "./planning";

// The generated Supabase types don't cover the newer tables yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Client = any;

export type PlanDocSummary = {
  id: string;
  title: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  source_url: string | null;
  updated_at: string;
};

export type PublishedReport = {
  id: string;
  report_type: "quarterly" | "annual";
  title: string;
  final_content: string | null;
  ai_draft: string | null;
  created_at: string;
};

export type MeetingTask = { id: string; title: string; owner: "student" | "counselor" | "parent"; due_date: string | null; completed: boolean; todo_id: string | null };

export type MeetingNote = {
  id: string;
  meeting_date: string;
  title: string | null;
  summary: string | null;
  decision_list: string[] | null;
  tasks: MeetingTask[];
};

export type UploadRequest = { id: string; due_date: string; message: string | null };

export type QuarterPlan = { id: string | null; focus: string; goals: Goal[]; rawGoals: string | null };

/** The plan the counselor marked as current, else the latest one. */
export async function getCurrentPlanDoc(client: Client, studentId: string): Promise<PlanDocSummary | null> {
  const { data } = await client
    .from("planning_documents")
    .select("id, title, content, file_path, file_name, source_url, updated_at")
    .eq("student_id", studentId)
    .order("is_primary", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data || null) as PlanDocSummary | null;
}

/** Reports the counselor has published (drafts are never returned to students). */
export async function listPublishedReports(client: Client, studentId: string): Promise<PublishedReport[]> {
  const { data } = await client
    .from("planning_reports")
    .select("id, report_type, title, final_content, ai_draft, created_at")
    .eq("student_id", studentId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return (data || []) as PublishedReport[];
}

export async function countMeetings(client: Client, studentId: string): Promise<number> {
  const { count } = await client.from("student_meetings").select("id", { count: "exact", head: true }).eq("student_id", studentId);
  return (count || 0) as number;
}

/**
 * Meeting notes with their tasks. A student task that became a to-do shows
 * the to-do's done state, so ticking it on the home page is reflected here.
 * Team-only notes live in another table and are not included.
 */
export async function listMeetingNotes(client: Client, studentId: string): Promise<MeetingNote[]> {
  const { data } = await client
    .from("student_meetings")
    .select("id, meeting_date, title, summary, decision_list")
    .eq("student_id", studentId)
    .order("meeting_date", { ascending: false });
  const list = (data || []) as Omit<MeetingNote, "tasks">[];
  if (!list.length) return [];
  const { data: items } = await client
    .from("meeting_action_items")
    .select("id, meeting_id, title, owner, due_date, completed, todo_id, created_at")
    .in("meeting_id", list.map((m) => m.id))
    .order("created_at");
  const rows = (items || []) as (MeetingTask & { meeting_id: string })[];
  const todoIds = rows.map((i) => i.todo_id).filter(Boolean);
  const { data: todos } = todoIds.length ? await client.from("todos").select("id, completed").in("id", todoIds) : { data: [] };
  const done = new Map(((todos || []) as { id: string; completed: boolean }[]).map((t) => [t.id, t.completed]));
  return list.map((m) => ({
    ...m,
    tasks: rows
      .filter((i) => i.meeting_id === m.id)
      .map(({ meeting_id: _m, ...i }) => ({ ...i, completed: i.todo_id && done.has(i.todo_id) ? !!done.get(i.todo_id) : i.completed })),
  }));
}

/** The earliest open request from the counselor to upload a report card. */
export async function getOpenUploadRequest(client: Client, studentId: string): Promise<UploadRequest | null> {
  const { data } = await client
    .from("academic_report_requests")
    .select("id, due_date, message")
    .eq("student_id", studentId)
    .is("fulfilled_at", null)
    .order("due_date")
    .limit(1)
    .maybeSingle();
  return (data || null) as UploadRequest | null;
}

export type SharedFolder = { id: string; folder_url: string; title: string; description: string | null; created_by: string };

export async function getSharedFolder(client: Client, studentId: string): Promise<SharedFolder | null> {
  const { data } = await client.from("shared_folders").select("*").eq("created_by", studentId).maybeSingle();
  return data || null;
}

export async function getQuarterPlan(client: Client, studentId: string, quarter: QuarterKey, year: string): Promise<QuarterPlan> {
  const { data } = await client
    .from("student_quarters")
    .select("id, quarter_focus, quarter_kpi")
    .eq("student_id", studentId)
    .eq("quarter", quarter)
    .eq("academic_year", year)
    .maybeSingle();
  return { id: data?.id ?? null, focus: data?.quarter_focus ?? "", goals: parseGoals(data?.quarter_kpi), rawGoals: data?.quarter_kpi ?? null };
}

// ---------------------------------------------------------------- to-dos

export type TodoRow = { id: string; title: string; completed: boolean; due_date: string | null; starred: boolean | null; created_at: string };

export async function listTodos(client: Client, studentId: string): Promise<TodoRow[]> {
  const { data, error } = await client
    .from("todos")
    .select("id, title, completed, due_date, starred, created_at")
    .eq("author_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as TodoRow[];
}

export async function addTodo(client: Client, studentId: string, title: string, dueDate?: string | null) {
  const { error } = await client.from("todos").insert({ title: title.trim(), author_id: studentId, completed: false, due_date: dueDate || null });
  if (error) throw error;
}

export async function setTodoDone(client: Client, todoId: string, completed: boolean) {
  const { error } = await client.from("todos").update({ completed }).eq("id", todoId);
  if (error) throw error;
}

export async function deleteTodo(client: Client, todoId: string) {
  const { error } = await client.from("todos").delete().eq("id", todoId);
  if (error) throw error;
}
