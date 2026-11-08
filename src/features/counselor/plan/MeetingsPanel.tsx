import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ClipboardList, FileUp, Loader2, Lock, Mail, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { db, fmtDate, todayIso, type Goal, type QuarterKey } from "./planData";

type Owner = "student" | "counselor" | "parent";
type Task = { id: string; title: string; owner: Owner; due_date: string | null; completed: boolean; todo_id: string | null };
type Meeting = {
  id: string;
  meeting_date: string;
  title: string | null;
  summary: string | null;
  decision_list: string[] | null;
  emailed_to: string[] | null;
  tasks: Task[];
  team_note: string | null;
};
type DraftTask = { key: number; text: string; owner: Owner; due: string; include: boolean };
type GoalUpdate = { key: number; kind: "done" | "add"; goal_id?: string; text: string; apply: boolean };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any;

async function loadMeetings(filter: (q: Query) => Query): Promise<Meeting[]> {
  const { data: ms, error } = (await filter(
    db.from("student_meetings").select("id, meeting_date, title, summary, decision_list, emailed_to"),
  )) as { data: Omit<Meeting, "tasks" | "team_note">[] | null; error: unknown };
  if (error) throw error;
  const list = ms || [];
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

export default function MeetingsPanel({
  studentId, quarter, year, goals, onSaved,
}: {
  studentId: string;
  quarter: QuarterKey;
  year: string;
  goals: Goal[];
  onSaved: () => void;
}) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const OWNER: Record<Owner, string> = { student: L("学生", "Student"), counselor: L("顾问", "Counselor"), parent: L("家长", "Parent") };
  const queryClient = useQueryClient();
  const key = ["plan-meetings", studentId, year, quarter];

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => loadMeetings((q) => q.eq("student_id", studentId).eq("academic_year", year).eq("quarter", quarter).order("meeting_date", { ascending: false })),
  });
  const { data: lastMeeting } = useQuery({
    queryKey: ["plan-last-meeting", studentId],
    queryFn: async () => (await loadMeetings((q) => q.eq("student_id", studentId).order("meeting_date", { ascending: false }).limit(1)))[0] ?? null,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["plan-meetings", studentId] });
    queryClient.invalidateQueries({ queryKey: ["plan-last-meeting", studentId] });
  };

  const [openId, setOpenId] = useState<string | null>(null);
  const shownId = openId ?? meetings[0]?.id ?? null;

  const toggleTask = async (t: Task) => {
    const res = t.todo_id
      ? await db.from("todos").update({ completed: !t.completed }).eq("id", t.todo_id).select("id")
      : await db.from("meeting_action_items").update({ completed: !t.completed, completed_at: t.completed ? null : new Date().toISOString() }).eq("id", t.id).select("id");
    if (res.error || !res.data?.length) toast.error(L("没能更新任务", "Couldn't update the task"));
    refresh();
  };

  const removeMeeting = async (m: Meeting) => {
    if (!window.confirm(L(`删除会议「${m.title || ""}」？已加入学生待办的任务会保留。`, `Delete "${m.title || ""}"? Tasks already in the student's to-dos are kept.`))) return;
    const { error } = await db.from("student_meetings").delete().eq("id", m.id);
    if (error) toast.error(L("删除失败", "Couldn't delete"));
    refresh();
  };

  // ---------------- record a meeting ----------------
  const [dialog, setDialog] = useState(false);
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
  const [mailStudent, setMailStudent] = useState(true);
  const [mailParent, setMailParent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setStep("notes");
    setDate(todayIso());
    setTitle("");
    setNotes("");
    setMailStudent(true);
    setMailParent(false);
    setDialog(true);
  };

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
      if (data.todos) parts.push(L(`${data.todos} 项任务已加入学生待办`, `${data.todos} tasks added to the student's to-dos`));
      if (data.goals_changed) parts.push(L("季度目标已更新", "goals updated"));
      if (data.emailed?.length) parts.push(L(`纪要已发给${data.emailed.join("、")}`, "summary emailed"));
      toast.success(parts.join(lang === "zh" ? "，" : ", "));
      setDialog(false);
      setOpenId(data.meeting_id);
      refresh();
      onSaved();
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

  const overdue = (d: string | null) => !!d && d < todayIso();
  const allTasks = meetings.flatMap((m) => m.tasks);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {L(`本季度已开会 ${meetings.length} 次`, `${meetings.length} meetings this quarter`)}
          {allTasks.length > 0 && ` · ${L("任务完成", "tasks done")} ${allTasks.filter((t) => t.completed).length}/${allTasks.length}`}
        </p>
        <Button onClick={start}><Plus className="mr-1.5 h-4 w-4" /> {L("记录会议", "Record a meeting")}</Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : meetings.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {L("这个季度还没有会议记录。开完会点「记录会议」，把笔记贴进来就行。", "No meetings this quarter. After a meeting, click “Record a meeting” and paste your notes.")}
        </p>
      ) : (
        <ul className="space-y-2">
          {meetings.map((m) => {
            const open = shownId === m.id;
            return (
              <li key={m.id} className="rounded-md border bg-card">
                <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenId(open ? "" : m.id)} aria-expanded={open}>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{fmtDate(m.meeting_date, lang)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.title || L("会议", "Meeting")}</span>
                  {m.tasks.length > 0 && <span className="shrink-0 text-xs text-muted-foreground">{L("任务", "Tasks")} {m.tasks.filter((t) => t.completed).length}/{m.tasks.length}</span>}
                </button>
                {open && (
                  <div className="space-y-4 border-t px-4 py-4 text-sm">
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
                        <p className="mb-1 text-xs font-medium text-muted-foreground">{L("任务", "Tasks")}</p>
                        <ul className="divide-y rounded-md border">
                          {m.tasks.map((t) => (
                            <li key={t.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                              <Checkbox checked={t.completed} onCheckedChange={() => void toggleTask(t)} />
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
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => void removeMeeting(m)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> {L("删除", "Delete")}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={dialog} onOpenChange={(o) => !busy && setDialog(o)}>
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
                        <Checkbox checked={t.completed} onCheckedChange={() => void toggleTask(t)} />
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
                <Label>{L("任务", "Tasks")} <span className="font-normal text-muted-foreground">· {L("学生的任务会加入他的待办清单，到期前自动提醒", "student tasks go to their to-do list with reminders")}</span></Label>
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
              <div className="flex flex-wrap items-center gap-4 rounded-md bg-muted/40 px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-4 w-4" /> {L("发送会议纪要（摘要 + 决定 + 任务）：", "Email the summary to:")}</span>
                <label className="flex items-center gap-2"><Checkbox checked={mailStudent} onCheckedChange={(v) => setMailStudent(!!v)} /> {L("学生", "Student")}</label>
                <label className="flex items-center gap-2"><Checkbox checked={mailParent} onCheckedChange={(v) => setMailParent(!!v)} /> {L("家长", "Parent")}</label>
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
    </div>
  );
}
