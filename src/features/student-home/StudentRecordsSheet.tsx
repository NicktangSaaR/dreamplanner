import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, ChevronDown, Circle, Loader2, NotebookPen, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MD } from "@/components/engines/markdownStyles";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { addLogNote, listLogNotes, listMeetingNotes, listPublishedReports } from "@/shared/studentApi";

/**
 * Views for the student: the communication log (meeting summaries + notes)
 * and published reports. Meetings and reports are read-only; the student can
 * add a note to the log.
 */
export default function StudentRecordsSheet({
  studentId, kind, onClose, authorName,
}: {
  studentId: string;
  kind: "meetings" | "reports" | null;
  authorName: string;
  onClose: () => void;
}) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-CA");
  const owner = (o: string) => (o === "student" ? L("我", "Me") : o === "parent" ? L("家长", "Parent") : L("顾问", "Counselor"));
  const [openId, setOpenId] = useState<string | null>(null);

  const meetings = useQuery({
    queryKey: ["student-meetings", studentId],
    enabled: kind === "meetings",
    queryFn: () => listMeetingNotes(supabase, studentId),
  });

  const notes = useQuery({
    queryKey: ["student-log-notes", studentId],
    enabled: kind === "meetings",
    queryFn: () => listLogNotes(supabase, studentId),
  });
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const saveNote = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await addLogNote(supabase, studentId, draft, authorName);
      setDraft("");
      qc.invalidateQueries({ queryKey: ["student-log-notes", studentId] });
      qc.invalidateQueries({ queryKey: ["student-meeting-count", studentId] });
    } catch {
      toast.error(L("没能保存", "Couldn't save"));
    } finally {
      setSaving(false);
    }
  };
  type Entry = { kind: "meeting"; id: string; at: string } | { kind: "note"; id: string; at: string };
  const entries: Entry[] = [
    ...(meetings.data || []).map((m) => ({ kind: "meeting" as const, id: m.id, at: m.meeting_date })),
    ...(notes.data || []).map((n) => ({ kind: "note" as const, id: n.id, at: n.created_at })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const reports = useQuery({
    queryKey: ["student-reports", studentId],
    enabled: kind === "reports",
    queryFn: () => listPublishedReports(supabase, studentId),
  });

  const loading = kind === "meetings" ? meetings.isLoading || notes.isLoading : reports.isLoading;
  const firstId = kind === "meetings" ? meetings.data?.[0]?.id : reports.data?.[0]?.id;
  const shown = openId ?? firstId ?? null;

  return (
    <Sheet open={kind !== null} onOpenChange={(o) => { if (!o) { setOpenId(null); onClose(); } }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="font-serif text-pine">{kind === "meetings" ? L("沟通记录", "Communication log") : L("规划报告", "Planning reports")}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : kind === "meetings" ? (
            <div className="space-y-4">
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)}
                placeholder={L("写一条记录给老师：进展、问题、想法……", "Leave a note for your counselor: progress, questions, ideas…")} />
              <div className="flex justify-end"><Button size="sm" onClick={() => void saveNote()} disabled={!draft.trim() || saving}>{L("保存", "Save")}</Button></div>
            </div>
            {!entries.length ? (
              <p className="text-sm text-muted-foreground">{L("还没有沟通记录。", "Nothing here yet.")}</p>
            ) : (
              <ul className="space-y-2">
                {entries.map((e) => {
                  if (e.kind === "note") {
                    const n = (notes.data || []).find((x) => x.id === e.id)!;
                    return (
                      <li key={`n-${n.id}`} className="rounded-md border border-dashed bg-card px-4 py-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <NotebookPen className="h-3.5 w-3.5" />{dateFmt(n.created_at)} · {L("笔记", "Note")}{n.author_name ? ` · ${n.author_name}` : ""}
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{n.content || n.title}</p>
                      </li>
                    );
                  }
                  const m = (meetings.data || []).find((x) => x.id === e.id)!;
                  const open = shown === m.id;
                  return (
                    <li key={m.id} className="rounded-md border bg-card">
                      <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenId(open ? "" : m.id)} aria-expanded={open}>
                        <Users className="h-4 w-4 shrink-0 text-primary" />
                        <span className="w-24 shrink-0 text-xs text-muted-foreground">{dateFmt(m.meeting_date)}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.title || L("会议", "Meeting")}</span>
                        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                      </button>
                      {open && (
                        <div className="space-y-4 border-t px-4 py-4 text-sm">
                          {m.summary && <p className="whitespace-pre-wrap leading-relaxed">{m.summary}</p>}
                          {(m.decision_list || []).length > 0 && (
                            <div>
                              <p className="mb-1 text-xs font-medium text-muted-foreground">{L("决定事项", "Decisions")}</p>
                              <ul className="list-disc space-y-1 pl-5">{(m.decision_list || []).map((d, i) => <li key={i}>{d}</li>)}</ul>
                            </div>
                          )}
                          {m.tasks.length > 0 && (
                            <div>
                              <p className="mb-1 text-xs font-medium text-muted-foreground">{L("任务", "Tasks")}</p>
                              <ul className="divide-y rounded-md border">
                                {m.tasks.map((t) => (
                                  <li key={t.id} className="flex items-center gap-3 px-3 py-2">
                                    {t.completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                    <span className={cn("min-w-0 flex-1", t.completed && "text-muted-foreground line-through")}>{t.title}</span>
                                    <Badge variant="outline" className="font-normal">{owner(t.owner)}</Badge>
                                    {t.due_date && <span className="text-xs text-muted-foreground">{t.due_date}</span>}
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-1.5 text-xs text-muted-foreground">{L("我的任务已加入待办清单，在首页勾选完成。", "Your tasks are in your to-do list on the home page.")}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            </div>
          ) : !reports.data?.length ? (
            <p className="text-sm text-muted-foreground">{L("还没有发布的报告。", "No published reports yet.")}</p>
          ) : (
            <ul className="space-y-2">
              {reports.data.map((r) => {
                const open = shown === r.id;
                return (
                  <li key={r.id} className="rounded-md border bg-card">
                    <button className="flex w-full items-center gap-2 px-4 py-3 text-left" onClick={() => setOpenId(open ? "" : r.id)} aria-expanded={open}>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
                      <Badge variant="outline" className="shrink-0">{r.report_type === "quarterly" ? L("季度评估", "Quarterly") : L("阶段总结", "Stage summary")}</Badge>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{dateFmt(r.created_at)}</span>
                    </button>
                    {open && (
                      <div className="space-y-2 border-t px-4 py-4 text-sm leading-relaxed">
                        <ReactMarkdown components={MD}>{r.final_content || r.ai_draft || ""}</ReactMarkdown>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
