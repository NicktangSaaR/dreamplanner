import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export type ReminderKind = "todo" | "activity";
type Row = { sent_at: string; sender: { full_name: string | null } | null };

export const lastReminderKey = (studentId: string, kind: ReminderKind) => ["last-reminder", studentId, kind];

/** "上次提醒：11月17日 15:02 · Nick" under a remind button; hover shows the last few. */
export default function LastReminder({ studentId, kind, className }: { studentId: string; kind: ReminderKind; className?: string }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { data, isLoading } = useQuery({
    queryKey: lastReminderKey(studentId, kind),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("student_reminder_log")
        .select("sent_at, sender:profiles!student_reminder_log_sent_by_fkey(full_name)")
        .eq("student_id", studentId).eq("kind", kind)
        .order("sent_at", { ascending: false }).limit(5);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  if (isLoading) return null;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(lang === "zh" ? "zh-CN" : "en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  const line = (r: Row) => `${fmt(r.sent_at)}${r.sender?.full_name ? ` · ${r.sender.full_name}` : ""}`;
  const label = kind === "todo" ? L("上次提醒", "Last reminded") : L("上次请求", "Last asked");
  const rows = data ?? [];

  return (
    <p
      className={cn("text-xs text-muted-foreground", className)}
      title={rows.length > 1 ? `${L("最近几次", "Recent")}:\n${rows.map(line).join("\n")}` : undefined}
    >
      {rows.length ? `${label}：${line(rows[0])}` : kind === "todo" ? L("还没发过提醒", "Not reminded yet") : L("还没请求过", "Not asked yet")}
    </p>
  );
}
