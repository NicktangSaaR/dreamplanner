import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StudentMessage = {
  id: string; subject: string | null; body: string; cc_parent: boolean; emailed: boolean; created_at: string;
  sender: { full_name: string | null } | null;
};

export const messagesKey = (studentId: string) => ["student-messages", studentId];

export function useStudentMessages(studentId: string | null | undefined) {
  return useQuery({
    queryKey: messagesKey(studentId ?? ""),
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("student_messages")
        .select("id, subject, body, cc_parent, emailed, created_at, sender:profiles!student_messages_sender_id_fkey(full_name)")
        .eq("student_id", studentId).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as StudentMessage[];
    },
  });
}

export type SendResult = { ok: boolean; emailed: boolean; reason?: "no_email" | "send_failed" };

export function useSendMessage(studentId: string) {
  const qc = useQueryClient();
  return async (input: { subject: string; body: string; cc_parent: boolean }): Promise<SendResult> => {
    const { data, error } = await supabase.functions.invoke("send-student-message", { body: { student_id: studentId, ...input } });
    void qc.invalidateQueries({ queryKey: messagesKey(studentId) });
    if (error) throw error;
    return data as SendResult;
  };
}

export const formatWhen = (iso: string, lang: string) =>
  new Date(iso).toLocaleString(lang === "zh" ? "zh-CN" : "en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
