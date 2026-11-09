import { db, todayIso } from "@/features/counselor/plan/planData";
import type { Owner } from "./meetings";

/**
 * One task list per student, from two tables:
 *  - todos: the student's own tasks (reminder emails / WeChat keep working);
 *  - meeting_action_items: counselor and parent tasks, from a meeting or added by hand.
 * A student task created in a meeting is a to-do linked from its action item,
 * so it appears once, labelled with the meeting.
 */
export type TaskSource = { kind: "meeting"; label: string } | { kind: "keydate" } | { kind: "manual" };
export type UnifiedTask = {
  key: string;
  table: "todos" | "meeting_action_items";
  id: string;
  title: string;
  owner: Owner;
  due: string | null;
  completed: boolean;
  source: TaskSource;
};

const day = (v: string | null | undefined) => (v ? String(v).slice(0, 10) : null);
const KEYDATE_PREFIX = "📌";

export async function loadTasks(studentId: string): Promise<UnifiedTask[]> {
  const [{ data: todos }, { data: items }] = await Promise.all([
    db.from("todos").select("id, title, completed, due_date, created_at").eq("author_id", studentId),
    db.from("meeting_action_items").select("id, meeting_id, title, owner, due_date, completed, todo_id").eq("student_id", studentId),
  ]);
  const itemRows = (items || []) as { id: string; meeting_id: string | null; title: string; owner: Owner; due_date: string | null; completed: boolean | null; todo_id: string | null }[];
  const meetingIds = [...new Set(itemRows.map((i) => i.meeting_id).filter(Boolean))] as string[];
  const { data: meetings } = meetingIds.length
    ? await db.from("student_meetings").select("id, meeting_date, title").in("id", meetingIds)
    : { data: [] };
  const meetingLabel = new Map(
    ((meetings || []) as { id: string; meeting_date: string; title: string | null }[]).map((m) => [m.id, `${m.meeting_date.slice(5, 10).replace("-", "/")} ${m.title || ""}`.trim()]),
  );
  const fromMeeting = new Map(itemRows.filter((i) => i.todo_id && i.meeting_id).map((i) => [i.todo_id as string, i.meeting_id as string]));

  const list: UnifiedTask[] = [
    ...((todos || []) as { id: string; title: string; completed: boolean | null; due_date: string | null }[]).map((t) => {
      const mid = fromMeeting.get(t.id);
      const source: TaskSource = mid
        ? { kind: "meeting", label: meetingLabel.get(mid) || "" }
        : t.title.startsWith(KEYDATE_PREFIX) ? { kind: "keydate" } : { kind: "manual" };
      return {
        key: `t-${t.id}`, table: "todos" as const, id: t.id,
        title: t.title.replace(new RegExp(`^${KEYDATE_PREFIX}\\s*`, "u"), ""),
        owner: "student" as Owner, due: day(t.due_date), completed: !!t.completed, source,
      };
    }),
    ...itemRows.filter((i) => !i.todo_id).map((i) => ({
      key: `a-${i.id}`, table: "meeting_action_items" as const, id: i.id, title: i.title, owner: i.owner,
      due: day(i.due_date), completed: !!i.completed,
      source: (i.meeting_id ? { kind: "meeting", label: meetingLabel.get(i.meeting_id) || "" } : { kind: "manual" }) as TaskSource,
    })),
  ];
  return list;
}

/** Open first (overdue, then by due date, undated last), then done. */
export function sortTasks(list: UnifiedTask[]): UnifiedTask[] {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return a.title.localeCompare(b.title);
  });
}

export const isOverdue = (t: UnifiedTask) => !t.completed && !!t.due && t.due < todayIso();

export async function addTask(studentId: string, owner: Owner, title: string, due: string | null) {
  const res = owner === "student"
    ? await db.from("todos").insert({ author_id: studentId, title, due_date: due || null, completed: false }).select("id")
    : await db.from("meeting_action_items").insert({ student_id: studentId, meeting_id: null, owner, title, due_date: due || null, completed: false }).select("id");
  if (res.error) throw res.error;
}

export async function setTaskDone(t: UnifiedTask, completed: boolean) {
  const patch = t.table === "todos" ? { completed } : { completed, completed_at: completed ? new Date().toISOString() : null };
  const res = await db.from(t.table).update(patch).eq("id", t.id).select("id");
  if (res.error || !res.data?.length) throw res.error || new Error("not updated");
}

export async function removeTask(t: UnifiedTask) {
  const { error } = await db.from(t.table).delete().eq("id", t.id);
  if (error) throw error;
}

// ---------------------------------------------------------------- key dates

export type KeyDate = { id: string; title: string; description: string | null; due_date: string; document_id: string | null };

export async function loadKeyDates(studentId: string, from: string, to: string): Promise<KeyDate[]> {
  const { data, error } = await db.from("planning_milestones").select("id, title, description, due_date, document_id")
    .eq("student_id", studentId).gte("due_date", from).lte("due_date", to).order("due_date");
  if (error) throw error;
  return (data || []) as KeyDate[];
}

export async function addKeyDate(studentId: string, title: string, due: string) {
  const { error } = await db.from("planning_milestones").insert({ student_id: studentId, title, due_date: due, reminder_emails: [], reminder_sent: false });
  if (error) throw error;
}

export async function removeKeyDate(id: string) {
  const { error } = await db.from("planning_milestones").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------- notes (counselor tool)

export type QuickNote = { id: string; title: string; content: string; author_name: string | null; created_at: string; is_pinned: boolean | null };

export async function loadNotes(studentId: string): Promise<QuickNote[]> {
  const { data, error } = await db.from("notes").select("id, title, content, author_name, created_at, is_pinned")
    .eq("author_id", studentId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as QuickNote[];
}

export async function addNote(studentId: string, content: string, authorName: string) {
  const text = content.trim();
  const firstLine = text.split("\n")[0];
  const title = firstLine.length > 40 ? `${firstLine.slice(0, 40)}…` : firstLine;
  const { error } = await db.from("notes").insert({ author_id: studentId, title, content: text, author_name: authorName });
  if (error) throw error;
}

export async function updateNote(id: string, content: string) {
  const text = content.trim();
  const firstLine = text.split("\n")[0];
  const { error } = await db.from("notes").update({ content: text, title: firstLine.length > 40 ? `${firstLine.slice(0, 40)}…` : firstLine }).eq("id", id);
  if (error) throw error;
}

export async function removeNote(id: string) {
  const { error } = await db.from("notes").delete().eq("id", id);
  if (error) throw error;
}
