import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVITY_COLUMNS, type Activity } from "./model";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const key = (studentId: string) => ["activities", studentId];

export function useActivities(studentId: string | null | undefined) {
  return useQuery({
    queryKey: key(studentId ?? ""),
    enabled: !!studentId,
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await db
        .from("extracurricular_activities")
        .select(ACTIVITY_COLUMNS)
        .eq("student_id", studentId)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ActivityDraft = Partial<Omit<Activity, "id" | "student_id" | "created_at" | "updated_at">>;

export function useActivityMutations(studentId: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: key(studentId) });

  const save = useMutation({
    mutationFn: async ({ id, draft }: { id?: string; draft: ActivityDraft }) => {
      if (id) {
        const { error } = await db.from("extracurricular_activities").update(draft).eq("id", id);
        if (error) throw error;
      } else {
        // new entries go to the end
        const { data: last } = await db.from("extracurricular_activities").select("sort_order")
          .eq("student_id", studentId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
        const { error } = await db.from("extracurricular_activities")
          .insert({ ...draft, student_id: studentId, sort_order: (last?.sort_order ?? 0) + 1 });
        if (error) throw error;
      }
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("extracurricular_activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  /** Save a new order (ids in order). */
  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(ids.map((id, i) => db.from("extracurricular_activities").update({ sort_order: i + 1 }).eq("id", id)));
      const failed = results.find((r: { error: unknown }) => r.error);
      if (failed) throw failed.error;
    },
    onMutate: async (ids: string[]) => {
      await qc.cancelQueries({ queryKey: key(studentId) });
      const prev = qc.getQueryData<Activity[]>(key(studentId));
      if (prev) {
        const pos = new Map(ids.map((id, i) => [id, i + 1]));
        qc.setQueryData(key(studentId), prev.map((a) => ({ ...a, sort_order: pos.get(a.id) ?? a.sort_order })));
      }
      return { prev };
    },
    onError: (_e, _ids, ctx) => ctx?.prev && qc.setQueryData(key(studentId), ctx.prev),
    onSettled: refresh,
  });

  const review = useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await db.from("extracurricular_activities").update(
        checked ? { reviewed_at: new Date().toISOString(), reviewed_by: user?.id ?? null, needs_review: false }
          : { reviewed_at: null, reviewed_by: null, needs_review: false },
      ).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  /** Add several entries at the end of the list (from pasted text). */
  const addMany = useMutation({
    mutationFn: async (drafts: ActivityDraft[]) => {
      const { data: last } = await db.from("extracurricular_activities").select("sort_order")
        .eq("student_id", studentId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const start = (last?.sort_order ?? 0) + 1;
      const { error } = await db.from("extracurricular_activities")
        .insert(drafts.map((d, i) => ({ ...d, student_id: studentId, sort_order: start + i })));
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { save, remove, reorder, review, addMany };
}

/** Counselor asks the student to update their portfolio: a to-do with a due date, and an email. */
export async function requestUpdate(studentId: string, due: string, note?: string): Promise<{ emailed: boolean; reason?: string; followups?: string[] }> {
  const { data, error } = await supabase.functions.invoke("activity-request", { body: { student_id: studentId, due, note } });
  if (error) throw error;
  return data;
}

export type Suggestion = { name_en: string; position: string; organization: string; description_en: string };

export async function assist(studentId: string, activity: ActivityDraft): Promise<Suggestion> {
  const { data, error } = await supabase.functions.invoke("activity-assist", { body: { student_id: studentId, activity } });
  if (error) {
    // the function's own message, when there is one
    const msg = await (error as { context?: Response }).context?.json?.().then((b: { error?: string }) => b?.error).catch(() => null);
    throw new Error(msg || "AI 暂时不可用，请稍后再试");
  }
  return data.suggestion as Suggestion;
}

export type HistoryRow = { id: string; activity_id: string; changed_by: string | null; changed_at: string; action: "added" | "changed" | "deleted"; before: Partial<Activity> | null; after: Partial<Activity> | null };

export function useActivityHistory(studentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["activity-history", studentId],
    enabled,
    queryFn: async (): Promise<HistoryRow[]> => {
      const { data, error } = await db.from("activity_history").select("id, activity_id, changed_by, changed_at, action, before, after")
        .eq("student_id", studentId).order("changed_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ParsedEntry = {
  name: string; name_en: string; category: string; status: "ongoing" | "ended" | "planned";
  start_date: string | null; end_date: string | null; hours_per_week: number | null; weeks_per_year: number | null;
  role: string; organization: string; level: string; description: string; description_en: string;
};

/** Pasted notes → separate entries, for the counselor to review before adding. */
export async function parseActivities(studentId: string, text: string): Promise<ParsedEntry[]> {
  const { data, error } = await supabase.functions.invoke("activity-assist", { body: { student_id: studentId, action: "parse", text } });
  if (error) {
    const msg = await (error as { context?: Response }).context?.json?.().then((b: { error?: string }) => b?.error).catch(() => null);
    throw new Error(msg || "AI 暂时不可用，请稍后再试");
  }
  return (data?.entries ?? []) as ParsedEntry[];
}
