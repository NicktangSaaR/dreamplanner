import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVITY_COLUMNS, type Activity, requestTitle } from "./model";

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

  return { save, remove, reorder, review };
}

/** Counselor asks the student to update their portfolio: a to-do with a due date. */
export async function requestUpdate(studentId: string, due: string, note?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await db.from("todos").insert({
    author_id: studentId, title: requestTitle(note), due_date: due || null, completed: false, assigned_by: user?.id ?? null,
  });
  if (error) throw error;
}

export type Suggestion = {
  name_en: string; position: string; organization: string; description_en: string;
  ca_text: string; uc_text: string; ca_type: string; uc_category: string;
};

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
