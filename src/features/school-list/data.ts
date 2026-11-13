import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type SystemCode = "CA" | "CO" | "UC" | "OU" | "BC" | "UK" | "HK" | "SG" | "GR" | "OTHER";
export type Status = "considering" | "preparing" | "submitted" | "admitted" | "waitlisted" | "deferred" | "rejected" | "withdrawn";
export type Category = "reach" | "target" | "safety" | "";

export type School = {
  id: string; student_id: string; college_name: string; major: string | null; round: string | null;
  application_system: SystemCode | null; country: string | null; category: string | null; deadline: string | null;
  deadline_checked: boolean; status: Status; notes: string | null; source: string | null; created_at: string;
};
export type Draft = Omit<School, "id" | "student_id" | "created_at">;

export const SYSTEM_LABEL: Record<SystemCode, string> = {
  CA: "Common App", CO: "Coalition", UC: "UC", OU: "OUAC", BC: "EducationPlannerBC", UK: "UCAS",
  HK: "香港网申", SG: "新加坡网申", GR: "硕士网申", OTHER: "其他",
};
export const STATUS_LABEL: Record<Status, { zh: string; en: string }> = {
  considering: { zh: "考虑中", en: "Considering" }, preparing: { zh: "准备中", en: "Preparing" },
  submitted: { zh: "已提交", en: "Submitted" }, admitted: { zh: "录取", en: "Admitted" },
  waitlisted: { zh: "候补", en: "Waitlisted" }, deferred: { zh: "延期", en: "Deferred" },
  rejected: { zh: "未录取", en: "Not admitted" }, withdrawn: { zh: "已撤回", en: "Withdrawn" },
};
export const CATEGORY_LABEL: Record<Exclude<Category, "">, { zh: string; en: string }> = {
  reach: { zh: "冲", en: "Reach" }, target: { zh: "稳", en: "Target" }, safety: { zh: "保", en: "Safety" },
};
export const ROUNDS = ["ED", "ED2", "EA", "REA", "RD", "Rolling", "Priority"];

const COLS = "id, student_id, college_name, major, round, application_system, country, category, deadline, deadline_checked, status, notes, source, created_at";
const key = (id: string) => ["school-list", id];

/** Soonest deadline first; no deadline last. */
export const byDeadline = (a: Pick<School, "deadline" | "college_name">, b: Pick<School, "deadline" | "college_name">) =>
  (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999") || a.college_name.localeCompare(b.college_name);

export function daysUntil(date: string | null, today = new Date()) {
  if (!date) return null;
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = date.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - t) / 86_400_000);
}

/** Application systems the list uses, for the application-info form. */
export const systemsOf = (list: Pick<School, "application_system" | "status">[]) =>
  [...new Set(list.filter((s) => s.status !== "withdrawn").map((s) => s.application_system).filter((x): x is SystemCode => !!x && x !== "OTHER"))];

export function useSchoolList(studentId: string) {
  return useQuery({
    queryKey: key(studentId),
    enabled: !!studentId,
    queryFn: async (): Promise<School[]> => {
      const { data, error } = await db.from("college_applications").select(COLS).eq("student_id", studentId);
      if (error) throw error;
      return ((data ?? []) as School[]).sort(byDeadline);
    },
  });
}

/** Keep the application-info form's systems in step with the school list. */
async function syncSystems(studentId: string) {
  const { data: list } = await db.from("college_applications").select("application_system, status").eq("student_id", studentId);
  const wanted = systemsOf(list ?? []);
  if (!wanted.length) return;
  const { data: row } = await db.from("application_profiles").select("systems").eq("student_id", studentId).maybeSingle();
  if (!row) return; // created with these systems when the form is first opened
  const next = [...new Set([...(row.systems ?? []), ...wanted])];
  if (next.length !== (row.systems ?? []).length) await db.from("application_profiles").update({ systems: next }).eq("student_id", studentId);
}

export function useSchoolMutations(studentId: string) {
  const qc = useQueryClient();
  const done = async () => {
    await syncSystems(studentId).catch(() => undefined);
    qc.invalidateQueries({ queryKey: key(studentId) });
    qc.invalidateQueries({ queryKey: ["application-profile", studentId] });
  };
  const save = useMutation({
    mutationFn: async ({ id, draft }: { id?: string; draft: Partial<Draft> }) => {
      const { error } = id
        ? await db.from("college_applications").update(draft).eq("id", id)
        : await db.from("college_applications").insert({ ...draft, student_id: studentId });
      if (error) throw error;
    },
    onSuccess: done,
  });
  const addMany = useMutation({
    mutationFn: async (rows: Partial<Draft>[]) => {
      const { error } = await db.from("college_applications").insert(rows.map((r) => ({ ...r, student_id: studentId })));
      if (error) throw error;
    },
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("college_applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: done,
  });
  return { save, addMany, remove };
}

export type Suggested = {
  college_name: string; major: string; round: string; application_system: SystemCode; country: string;
  category: Category; deadline: string | null; deadline_from_notes: boolean; evidence: string;
};
export type SuggestedTodo = { title: string; due_date: string | null; owner: "student" | "counselor"; school: string };

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("school-list-assist", { body });
  if (error) {
    const msg = await (error as { context?: Response }).context?.json?.().then((b: { error?: string }) => b?.error).catch(() => null);
    throw new Error(msg || "AI 暂时不可用，请稍后再试");
  }
  return data as T;
}
type Extracted = { schools: Suggested[]; sources: { meetings?: number; reports?: number; documents?: number; uploaded?: number }; empty?: boolean };
/** From the student's planning documents, reports and meeting notes. */
export const extractSchools = (studentId: string) => call<Extracted>({ action: "extract", student_id: studentId });
/** From a school list the counselor pasted. */
export const extractFromText = (studentId: string, text: string) => call<Extracted>({ action: "extract", student_id: studentId, text });
export const UPLOAD_ACCEPT = ".xlsx,.xls,.csv,.docx,.pdf,.txt";
/** From a school list file the counselor uploaded (up to 5 MB). */
export async function extractFromFile(studentId: string, file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error("文件太大，请小于 5 MB");
  const base64 = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("没能读取文件"));
    r.readAsDataURL(file);
  });
  return call<Extracted>({ action: "extract", student_id: studentId, file: { name: file.name, base64 } });
}
export const suggestTodos = (studentId: string) => call<{ todos: SuggestedTodo[]; empty?: boolean }>({ action: "todos", student_id: studentId });

/** Add the chosen to-dos: the student's go on their to-do list, the counselor's on the counselor task list. */
export async function addTodos(studentId: string, items: SuggestedTodo[]) {
  const { data: { user } } = await supabase.auth.getUser();
  const forStudent = items.filter((t) => t.owner === "student").map((t) => ({ author_id: studentId, title: t.title, due_date: t.due_date, completed: false, assigned_by: user?.id ?? null }));
  const forCounselor = items.filter((t) => t.owner === "counselor").map((t) => ({ student_id: studentId, title: t.title, due_date: t.due_date, owner: "counselor", completed: false }));
  if (forStudent.length) {
    const { error } = await db.from("todos").insert(forStudent);
    if (error) throw error;
  }
  if (forCounselor.length) {
    const { error } = await db.from("meeting_action_items").insert(forCounselor);
    if (error) throw error;
  }
  return { student: forStudent.length, counselor: forCounselor.length };
}
