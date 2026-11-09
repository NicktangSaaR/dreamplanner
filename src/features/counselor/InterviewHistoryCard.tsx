import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Circle, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Q = { key: string; text: string; type: string; answered: boolean; attempts: number };
type Session = {
  id: string;
  mode: "simulation" | "practice";
  title: string;
  status: "in_progress" | "completed" | "exited";
  questions: Q[];
  total: number;
  answered: number;
  started_at: string;
  updated_at: string;
};

const SHOW = 5;
const STALE_MS = 3 * 3600 * 1000; // an "in progress" run untouched for 3 hours was abandoned

/**
 * The student's recent mock-interview runs: which questions were drawn and
 * which were answered. Recordings stay on the student's computer.
 */
export default function InterviewHistoryCard({ studentId }: { studentId: string }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [openId, setOpenId] = useState<string | null>(null);
  const [all, setAll] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["interview-history", studentId],
    queryFn: async () => {
      const { data, error } = await db
        .from("mock_interview_sessions")
        .select("id, mode, title, status, questions, total, answered, started_at, updated_at")
        .eq("student_id", studentId)
        .order("started_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as Session[];
    },
  });

  const monthAgo = Date.now() - 30 * 86400000;
  const recent = sessions.filter((s) => new Date(s.started_at).getTime() >= monthAgo);
  const answeredRecent = recent.reduce((n, s) => n + s.answered, 0);

  const statusOf = (s: Session) => {
    if (s.status === "completed" && s.answered >= s.total) return { label: L("已完成", "Completed"), tone: "text-primary bg-primary/10" };
    if (s.status === "completed") return { label: L(`完成 ${s.answered}/${s.total}`, `${s.answered}/${s.total} done`), tone: "text-brass bg-brass/10" };
    if (s.status === "exited") return { label: L(`中途退出 ${s.answered}/${s.total}`, `Left early ${s.answered}/${s.total}`), tone: "text-destructive bg-destructive/10" };
    const stale = Date.now() - new Date(s.updated_at).getTime() > STALE_MS;
    return stale
      ? { label: L(`未完成 ${s.answered}/${s.total}`, `Unfinished ${s.answered}/${s.total}`), tone: "text-destructive bg-destructive/10" }
      : { label: L("进行中", "In progress"), tone: "text-muted-foreground bg-muted" };
  };
  const when = (iso: string) =>
    new Date(iso).toLocaleString(lang === "zh" ? "zh-CN" : "en-CA", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const shown = all ? sessions : sessions.slice(0, SHOW);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><Video className="h-5 w-5 text-primary" />{L("模拟面试练习", "Mock interview practice")}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {recent.length
            ? L(`近 30 天练习 ${recent.length} 次，答了 ${answeredRecent} 道题`, `${recent.length} runs and ${answeredRecent} answers in the last 30 days`)
            : L("近 30 天没有练习记录", "No practice in the last 30 days")}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? null : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{L("学生还没有练习过模拟面试。", "No mock interview practice yet.")}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {shown.map((s) => {
              const st = statusOf(s);
              const open = openId === s.id;
              return (
                <li key={s.id}>
                  <button className="flex w-full items-start gap-2 px-3 py-2.5 text-left" onClick={() => setOpenId(open ? null : s.id)} aria-expanded={open}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.mode === "simulation" ? L("全真模拟", "Full simulation") : L("专项练习", "Practice")}
                        {s.title ? <span className="font-normal text-muted-foreground"> · {s.title}</span> : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{when(s.started_at)} · {L(`${s.total} 题`, `${s.total} questions`)}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs", st.tone)}>{st.label}</span>
                    <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                  </button>
                  {open && (
                    <ol className="space-y-1.5 border-t bg-muted/20 px-3 py-2.5 text-sm">
                      {s.questions.map((q, i) => (
                        <li key={q.key + i} className="flex items-start gap-2">
                          {q.answered ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />}
                          <span className={cn("flex-1 leading-snug", !q.answered && "text-muted-foreground")}>{q.text}</span>
                          {q.attempts > 1 && <span className="shrink-0 text-xs text-muted-foreground">{L(`答 ${q.attempts} 次`, `${q.attempts} tries`)}</span>}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {sessions.length > SHOW && (
          <button className="text-sm text-primary hover:underline" onClick={() => setAll(!all)}>
            {all ? L("收起", "Show fewer") : L(`查看全部 ${sessions.length} 次`, `Show all ${sessions.length}`)}
          </button>
        )}
        <p className="text-xs text-muted-foreground">{L("录像只保存在学生自己的电脑上，这里只记录练了哪些题、是否答完。", "Recordings stay on the student's computer; only the questions and whether they were answered are recorded.")}</p>
      </CardContent>
    </Card>
  );
}
