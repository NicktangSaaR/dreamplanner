import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Answers, Applicant, System } from "./fields";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type Review = { at: string; by: string; needs_review?: boolean };
export type AppProfile = {
  student_id: string;
  applicant_type: Applicant;
  systems: System[];
  data: Answers;
  reviews: Record<string, Review>;
  updated_at: string;
  updated_by: string | null;
};

const key = (id: string) => ["application-profile", id];
const COLS = "student_id, applicant_type, systems, data, reviews, updated_at, updated_by";

/** Starting answers from what the student already told us at sign-up. */
export function prefill(p: { english_name?: string | null; email?: string | null; school?: string | null; interested_majors?: string | null; applicant_type?: string | null }): { applicant_type: Applicant; data: Answers } {
  const email = p.email && !p.email.toLowerCase().endsWith("@student.dreamplaneredu.com") ? p.email : "";
  const majors = (p.interested_majors ?? "").split(",").map((s) => s.trim()).filter((s) => s && s !== "Undecided").join("; ");
  const data: Answers = {};
  const put = (s: string, k: string, v: string) => { if (v) (data[s] ??= {})[k] = v; };
  put("personal", "preferred_name", (p.english_name ?? "").trim());
  put("contact", "email", email);
  put("schools", "current_school", (p.school ?? "").trim());
  put("choices", "intended_major", majors);
  return { applicant_type: p.applicant_type === "graduate" ? "graduate" : "first_year", data };
}

export function useApplicationProfile(studentId: string) {
  return useQuery({
    queryKey: key(studentId),
    enabled: !!studentId,
    queryFn: async (): Promise<AppProfile> => {
      const { data, error } = await db.from("application_profiles").select(COLS).eq("student_id", studentId).maybeSingle();
      if (error) throw error;
      if (data) return data;
      // first visit: create it, starting from the sign-up details
      const { data: p } = await db.from("profiles").select("english_name, email, school, interested_majors, applicant_type").eq("id", studentId).maybeSingle();
      const start = prefill(p ?? {});
      const { data: created, error: e2 } = await db.from("application_profiles")
        .upsert({ student_id: studentId, applicant_type: start.applicant_type, data: start.data }, { onConflict: "student_id", ignoreDuplicates: true })
        .select(COLS).maybeSingle();
      if (e2) throw e2;
      if (created) return created;
      const { data: again, error: e3 } = await db.from("application_profiles").select(COLS).eq("student_id", studentId).single();
      if (e3) throw e3;
      return again;
    },
  });
}

export function useApplicationMutations(studentId: string) {
  const qc = useQueryClient();
  const patchCache = (fn: (p: AppProfile) => AppProfile) =>
    qc.setQueryData<AppProfile>(key(studentId), (p) => (p ? fn(p) : p));

  const saveSection = useMutation({
    mutationFn: async ({ section, value }: { section: string; value: Record<string, unknown> }) => {
      const { error } = await db.rpc("save_application_section", { p_student: studentId, p_section: section, p_value: value });
      if (error) throw error;
    },
    onMutate: ({ section, value }) => patchCache((p) => ({ ...p, data: { ...p.data, [section]: value } })),
  });

  const saveSettings = useMutation({
    mutationFn: async (patch: { applicant_type?: Applicant; systems?: System[] }) => {
      const { error } = await db.from("application_profiles").update(patch).eq("student_id", studentId);
      if (error) throw error;
    },
    onMutate: (patch) => patchCache((p) => ({ ...p, ...patch })),
  });

  const review = useMutation({
    mutationFn: async ({ section, checked }: { section: string; checked: boolean }) => {
      const { error } = await db.rpc("review_application_section", { p_student: studentId, p_section: section, p_checked: checked });
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key(studentId) }),
  });

  return { saveSection, saveSettings, review, refresh: () => qc.invalidateQueries({ queryKey: key(studentId) }) };
}
