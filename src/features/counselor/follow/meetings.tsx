import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ClipboardList, FileUp, Loader2, Lock, Mail, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { academicYear, currentQuarter, db, fmtDate, parseGoals, todayIso, type Goal, type QuarterKey } from "@/features/counselor/plan/planData";

export type Owner = "student" | "counselor" | "parent";
export type Task = { id: string; title: string; owner: Owner; due_date: string | null; completed: boolean; todo_id: string | null };
export type Meeting = {
  id: string;
  meeting_date: string;
  title: string | null;
  summary: string | null;
  decision_list: string[] | null;
  emailed_to: string[] | null;
  quarter: string | null;
  tasks: Task[];
  team_note: string | null;
};
type DraftTask = { key: number; text: string; owner: Owner; due: string; include: boolean };
type GoalUpdate = { key: number; kind: "done" | "add"; goal_id?: string; text: string; apply: boolean };

export const useOwnerLabels = () => {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  return { student: L("学生", "Student"), counselor: L("顾问", "Counselor"), parent: L("家长", "Parent") } as Record<Owner, string>;
};

/** All of a student's meetings (newest first) with their tasks and team notes. */
export async function loadMeetings(studentId: string, limit?: number): Promise<Meeting[]> {
  let q = db.from("student_meetings").select("id, meeting_date, title, summary, decision_list, emailed_to, quarter")
    .eq("student_id", studentId).order("meeting_date", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data: ms, error } = await q;
  if (error) throw error;
  const list = (ms || []) as Omit<Meeting, "tasks" | "team_note">[];
  if (!list.length) return [];
  const ids = list.map((m) => m.id);
  const [{ data: items }, { data: privs }] = await Promise.all([
    db.from("meeting_action_items").select("id, meeting_id, title, owner, due_date, completed, todo_id, created_at").in("meeting_id", ids).order("created_at"),
    db.from("meeting_private").select("meeting_id, team_note").in("meeting_id", ids),
  ]);
  const todoIds = (items || []).map((i: { todo_id: string | null }) => i.todo_id).filter(Boolean);
  const { data: todos } = todoIds.length ? await db.from("todos").select("id, completed").in("id", todoIds) : { data: [] };
  const todoDone = new Map((todos || []).map((t: { id: string; completed: boolean }) => [t.id, t.completed]));
  return list.map((m) => ({
    ...m,
    tasks: (items || [])
      .filter((i: { meeting_id: string }) => i.meeting_id === m.id)
      .map((i: Task & { meeting_id: string }) => ({ ...i, completed: i.todo_id && todoDone.has(i.todo_id) ? !!todoDone.get(i.todo_id) : i.completed })),
    team_note: (privs || []).find((p: { meeting_id: string }) => p.meeting_id === m.id)?.team_note ?? null,
  }));
}

/** Tick a meeting task: a student task ticks the linked to-do. */
export async function toggleMeetingTask(t: Task): Promise<boolean> {
  const res = t.todo_id
    ? await db.from("todos").update({ completed: !t.completed }).eq("id", t.todo_id).select("id")
    : await db.from("meeting_action_items").update({ completed: !t.completed, completed_at: t.completed ? null : new Date().toISOString() }).eq("id", t.id).select("id");
  return !res.error && !!res.data?.length;
}

const overdue = (d: string | null) => !!d && d < todayIso();

/** The expanded content of one meeting. */
export function MeetingBody({ meeting: m, onToggleTask, onDelete }: { meeting: Meeting; onToggleTask: (t: Task) => void; onDelete: () => void }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const OWNER = useOwnerLabels();
  return (
    <div className="space-y-4 text-sm">
      {m.summary && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{L("会议摘要", "Summary")}</p>
          <p className="whitespace-pre-wrap leading-relaxed">{m.summary}</p>
        </div>
      )}
      {(m.decision_list || []).length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{L("决定事项", "Decisions")}</p>
          <ul className="space-y-1">{(m.decision_list || []).map((d, i) => <li key={i} className="pl-4 before:-ml-3 before:mr-1.5 before:content-['•']">{d}</li>)}</ul>
        </div>
      )}
      {m.tasks.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{L("会上定的任务 · 已进入任务清单", "Tasks · in the task list")}</p>
          <ul className="divide-y rounded-md border">
            {m.tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                <Checkbox checked={t.completed} onCheckedChange={() => onToggleTask(t)} />
                <span className={cn("min-w-0 flex-1", t.completed && "text-muted-foreground line-through")}>{t.title}</span>
                <Badge variant="outline" className="font-normal">{OWNER[t.owner] || t.owner}</Badge>
                <span className={cn("w-24 text-right text-xs", !t.completed && overdue(t.due_date) ? "text-destructive" : "text-muted-foreground")}>{t.due_date || ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {m.team_note && (
        <div className="rounded-md border border-dashed bg-muted/30 p-3">
          <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Lock className="h-3 w-3" /> {L("团队备注 · 学生看不到", "Team note · hidden from the student")}</p>
          <p className="whitespace-pre-wrap">{m.team_note}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {L("会议纪要邮件", "Summary email")}：{(m.emailed_to || []).join("、") || L("未发送", "not sent")}</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onDelete}>
          <Trash2 className="mr-1 h-3.5 w-3.5" /> {L("删除", "Delete")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Record a meeting: paste notes → AI organises (summary, decisions, tasks,
 * goal changes, team note) → review → save. The quarter (and the goals the AI
 * may tick) follow the meeting date.
 */
export function RecordMeetingDialog({
  studentId, open, onOpenChange, onSaved,
}: {
  studentId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: (meetingId: string) => void;
}) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const OWNER = useOwnerLabels();

  const [step, setStep] = useState<"notes" | "review">("notes");
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [updates, setUpdates] = useState<GoalUpdate[]>([]);
  const [teamNote, setTeamNote] = useState("");
  const [mailStudent, setMailStudent] = useState(false);
  const [mailParent, setMailParent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const when = new Date(`${date || todayIso()}T12:00:00`);
  const quarter: QuarterKey = currentQuarter(when);
  const year = academicYear(when);

  const { data: goals = [] } = useQuery({
    queryKey: ["plan-quarter-goals", studentId, year, quarter],
    enabled: open,
    queryFn: async () => {
      const { data } = await db.from("student_quarters").select("quarter_kpi").eq("student_id", studentId).eq("academic_year", year).eq("quarter", quarter).maybeSingle();
      return parseGoals(data?.quarter_kpi) as Goal[];
    },
  });
  const { data: followups = [] } = useQuery({
    queryKey: ["plan-followups", studentId],
    enabled: open,
    queryFn: async () => {
      const { data: rows } = await db.from("counselor_collaborations").select("collaborator_id").eq("student_id", studentId).eq("role", "followup");
      const ids = (rows || []).map((r: { collaborator_id: string }) => r.collaborator_id);
      if (!ids.length) return [] as string[];
      const { data: people } = await db.from("profiles").select("full_name, email").in("id", ids);
      return (people || []).map((p: { full_name: string | null; email: string | null }) => p.full_name || p.email || "").filter(Boolean) as string[];
    },
  });
  const { data: lastMeeting, refetch: refetchLast } = useQuery({
    queryKey: ["plan-last-meeting", studentId],
    enabled: open,
    queryFn: async () => (await loadMeetings(studentId, 1))[0] ?? null,
  });

  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setStep("notes");
    setDate(todayIso());
    setTitle("");
    setNotes("");
    setMailStudent(false);
    setMailParent(false);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const organize = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("meeting-assistant", {
        body: { action: "organize", student_id: studentId, notes, quarter, academic_year: year, goals, today: date },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setTitle(title || data.title || "");
      setSummary(data.summary || "");
      setDecisions(data.decisions || []);
      setTasks((data.tasks || []).map((t: { text: string; owner: Owner; due: string | null }, i: number) => ({ key: i, text: t.text, owner: t.owner, due: t.due || "", include: true })));
      setUpdates((data.goal_updates || []).map((u: { kind: "done" | "add"; goal_id?: string; text?: string }, i: number) => ({
        key: i, kind: u.kind, goal_id: u.goal_id,
        text: u.kind === "done" ? goals.find((g) => g.id === u.goal_id)?.text || "" : u.text || "",
        apply: true,
      })));
      setTeamNote(data.team_note || "");
      setStep("review");
    } catch (e) {
      toast.error(`${L("整理失败", "Couldn't organise the notes")}${e instanceof Error && e.message ? `：${e.message}` : ""}`);
    } finally {
      setBusy(false);
    }
  };

  const skipAi = () => {
    setSummary("");
    setDecisions([]);
    setTasks([]);
    setUpdates([]);
    setTeamNote("");
    setStep("review");
  };

  const save = async () => {
    const who = [mailStudent && L("学生", "the student"), mailParent && L("家长", "the parent")].filter(Boolean).join(L("和", " and "));
    if (who && !window.confirm(L(`确认把会议纪要（摘要、决定事项、任务）发邮件给${who}？`, `Email the meeting summary to ${who}?`))) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("meeting-assistant", {
        body: {
          action: "save",
          student_id: studentId,
          meeting: {
            date, title, summary, decisions: decisions.filter((d) => d.trim()), quarter, academic_year: year,
            tasks: tasks.filter((t) => t.include && t.text.trim()).map((t) => ({ text: t.text, owner: t.owner, due: t.due || null })),
            team_note: teamNote, raw_notes: notes,
          },
          goal_updates: updates.filter((u) => u.apply).map((u) => (u.kind === "done" ? { kind: "done", goal_id: u.goal_id } : { kind: "add", text: u.text })),
          email: { student: mailStudent, parent: mailParent },
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      const parts = [L("会议已保存", "Meeting saved")];
      const n = tasks.filter((t) => t.include && t.text.trim()).length;
      if (n) parts.push(L(`${n} 项任务已进入任务清单`, `${n} tasks added to the task list`));
      if (data.goals_changed) parts.push(L("季度目标已更新", "goals updated"));
      if (data.followup?.length) parts.push(L(`任务已发给跟进老师 ${data.followup.join("、")}`, `tasks sent to ${data.followup.join(", ")}`));
      if (data.emailed?.length) parts.push(L(`纪要已发给${data.emailed.join("、")}`, "summary emailed"));
      toast.success(parts.join(lang === "zh" ? "，" : ", "));
      onOpenChange(false);
      onSaved(data.meeting_id);
    } catch (e) {
      toast.error(`${L("保存失败", "Couldn't save")}${e instanceof Error && e.message ? `：${e.message}` : ""}`);
    } finally {
      setBusy(false);
    }
  };

  const onNotesFile = async (f?: File) => {
    if (!f) return;
    if (!/\.(txt|md)$/i.test(f.name)) {
      toast.error(L("目前支持 .txt 文件；Word 内容请直接复制粘贴", "Only .txt is supported; paste Word content instead"));
      return;
    }
    const text = (await f.text()).trim();
    setNotes((n) => [n.trim(), text].filter(Boolean).join("\n\n"));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{step === "notes" ? L("记录会议", "Record a meeting") : L("确认会议整理结果", "Review the meeting")}</DialogTitle></DialogHeader>

        {step === "notes" ? (
          <div className="space-y-4 text-sm">
            {lastMeeting && lastMeeting.tasks.length > 0 && (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ClipboardList className="h-3.5 w-3.5" /> {L(`上次会议（${fmtDate(lastMeeting.meeting_date, lang)}）的任务，先回顾一下`, `Tasks from the last meeting (${fmtDate(lastMeeting.meeting_date, lang)})`)}
                </p>
                <ul className="space-y-1">
                  {lastMeeting.tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <Checkbox checked={t.completed} onCheckedChange={async () => { await toggleMeetingTask(t); void refetchLast(); }} />
                      <span className={cn("flex-1", t.completed && "text-muted-foreground line-through")}>{t.title}</span>
                      <span className="text-xs text-muted-foreground">{OWNER[t.owner] || t.owner}{t.due_date && ` · ${t.due_date}`}</span>
                      {!t.completed && overdue(t.due_date) && <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">{L("已逾期", "Overdue")}</Badge>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
              <div className="space-y-1.5"><Label>{L("会议日期", "Date")}</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>{L("主题（可不填，AI 会起）", "Title (optional)")}</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="mt-notes">{L("会议记录", "Notes")}</Label>
                <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={(e) => { void onNotesFile(e.target.files?.[0]); e.target.value = ""; }} />
                <button type="button" className="flex items-center gap-1 text-xs text-primary hover:underline" onClick={() => fileRef.current?.click()}>
                  <FileUp className="h-3.5 w-3.5" /> {L("上传 txt", "Upload .txt")}
                </button>
              </div>
              <Textarea id="mt-notes" rows={9} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder={L("粘贴手写笔记、腾讯会议 / Zoom / 飞书的会议纪要，越随意越好，AI 会帮你整理", "Paste rough notes or a Zoom / Teams summary. AI will organise them.")} />
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
              <div className="space-y-1.5"><Label>{L("会议日期", "Date")}</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>{L("主题", "Title")}</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>{L("会议摘要", "Summary")} <span className="font-normal text-muted-foreground">· {L("学生可见", "visible to the student")}</span></Label>
              <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{L("决定事项", "Decisions")}</Label>
              <ul className="space-y-1.5">
                {decisions.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <Input value={d} onChange={(e) => setDecisions(decisions.map((x, j) => (j === i ? e.target.value : x)))} />
                    <Button variant="ghost" size="icon" aria-label={L("删除", "Delete")} onClick={() => setDecisions(decisions.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" onClick={() => setDecisions([...decisions, ""])}><Plus className="mr-1 h-3.5 w-3.5" /> {L("添加", "Add")}</Button>
            </div>
            <div className="space-y-1.5">
              <Label>{L("任务", "Tasks")} <span className="font-normal text-muted-foreground">· {L("保存后进入任务清单；学生的任务到期前自动提醒", "go to the task list; student tasks get reminders")}</span></Label>
              {tasks.length > 0 && (
                <ul className="divide-y rounded-md border">
                  {tasks.map((t) => (
                    <li key={t.key} className="flex flex-wrap items-center gap-2 px-3 py-2">
                      <Checkbox checked={t.include} onCheckedChange={(v) => setTasks(tasks.map((x) => (x.key === t.key ? { ...x, include: !!v } : x)))} />
                      <Input className="h-8 min-w-[200px] flex-1" value={t.text} onChange={(e) => setTasks(tasks.map((x) => (x.key === t.key ? { ...x, text: e.target.value } : x)))} />
                      <Select value={t.owner} onValueChange={(v) => setTasks(tasks.map((x) => (x.key === t.key ? { ...x, owner: v as Owner } : x)))}>
                        <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>{(Object.keys(OWNER) as Owner[]).map((o) => <SelectItem key={o} value={o}>{OWNER[o]}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="date" className="h-8 w-40" value={t.due} onChange={(e) => setTasks(tasks.map((x) => (x.key === t.key ? { ...x, due: e.target.value } : x)))} />
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="ghost" size="sm" onClick={() => setTasks([...tasks, { key: Date.now(), text: "", owner: "student", due: "", include: true }])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> {L("添加任务", "Add task")}
              </Button>
            </div>
            {updates.length > 0 && (
              <div className="space-y-1.5">
                <Label>{L("季度目标", "Quarterly goals")} <span className="font-normal text-muted-foreground">· {L("AI 建议，勾选才会生效", "AI suggestions, applied only if ticked")}</span></Label>
                <ul className="space-y-1.5 rounded-md border bg-primary/5 p-3">
                  {updates.map((u) => (
                    <li key={u.key} className="flex items-start gap-2">
                      <Checkbox className="mt-0.5" checked={u.apply} onCheckedChange={(v) => setUpdates(updates.map((x) => (x.key === u.key ? { ...x, apply: !!v } : x)))} />
                      <span>{u.kind === "done" ? L("标为完成：", "Mark done: ") : L("新增目标：", "Add goal: ")}<b>{u.text}</b></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> {L("团队备注", "Team note")} <span className="font-normal text-muted-foreground">· {L("只有服务团队能看到", "team only")}</span></Label>
              <Textarea rows={2} value={teamNote} onChange={(e) => setTeamNote(e.target.value)} />
            </div>
            <div className="space-y-2 rounded-md bg-muted/40 px-3 py-2.5">
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                {followups.length
                  ? L(`保存后，任务会自动发邮件给跟进老师：${followups.join("、")}`, `On save, tasks are emailed to the follow-up teacher: ${followups.join(", ")}`)
                  : L("这个学生还没有跟进老师，任务不会自动发邮件。可在「概览」的服务团队里添加。", "No follow-up teacher yet, so tasks won't be emailed. Add one in the team card.")}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-muted-foreground">{L("另外发送会议纪要给（需确认）：", "Also email the summary to (asks to confirm):")}</span>
                <label className="flex items-center gap-2"><Checkbox checked={mailStudent} onCheckedChange={(v) => setMailStudent(!!v)} /> {L("学生", "Student")}</label>
                <label className="flex items-center gap-2"><Checkbox checked={mailParent} onCheckedChange={(v) => setMailParent(!!v)} /> {L("家长", "Parent")}</label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "notes" ? (
            <>
              <Button variant="ghost" onClick={skipAi} disabled={busy}>{L("不用 AI，手动填写", "Fill in manually")}</Button>
              <Button onClick={() => void organize()} disabled={!notes.trim() || busy}>
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />} {L("AI 整理", "Organise with AI")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("notes")} disabled={busy}>{L("返回修改记录", "Back to notes")}</Button>
              <Button onClick={() => void save()} disabled={busy || (!summary.trim() && !tasks.some((t) => t.include && t.text.trim()))}>
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />} {L("保存", "Save")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
