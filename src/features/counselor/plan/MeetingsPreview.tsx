import { useState } from "react";
import { Check, ChevronDown, ClipboardList, Loader2, Lock, Mail, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Preview of quarterly meeting records: notes → AI summary → tasks and goal updates. */

export type Goal = { id: number; text: string; done: boolean };
type Owner = "student" | "counselor" | "parent";
type Task = { id: number; text: string; owner: Owner; due: string; done: boolean; include?: boolean };
type Meeting = {
  id: number;
  date: string;
  title: string;
  summary: string;
  decisions: string[];
  tasks: Task[];
  teamNote: string;
  emailed: string;
};
type GoalSuggestion = { id: number; kind: "done" | "add"; goalId?: number; text: string; apply: boolean };

const TODAY = new Date(2026, 10, 8);
const overdue = (due: string) => {
  const [y, m, d] = due.split(/[/-]/).map(Number);
  return new Date(y, m - 1, d) < TODAY;
};

const OWNER: Record<Owner, string> = { student: "学生", counselor: "顾问", parent: "家长" };

const INITIAL: Meeting[] = [
  {
    id: 2,
    date: "2026/10/24",
    title: "SHAD 申请与研究机会",
    summary: "SHAD 文书完成初稿，主题定为水质检测项目；UBC 研究机会已联系两位教授，一位回复需要面谈。",
    decisions: ["SHAD 文书围绕水质检测项目展开", "优先跟进回复了的王教授"],
    tasks: [
      { id: 21, text: "SHAD 文书修改第二稿", owner: "student", due: "2026/10/31", done: true },
      { id: 22, text: "准备与王教授面谈的研究兴趣介绍（1 页）", owner: "student", due: "2026/11/7", done: false },
      { id: 23, text: "帮学生约推荐信老师", owner: "counselor", due: "2026/11/3", done: true },
    ],
    teamNote: "学生对研究很积极，但时间管理偏弱，近期功课压力大，注意任务量。",
    emailed: "学生",
  },
  {
    id: 1,
    date: "2026/9/26",
    title: "Q1 开学规划会",
    summary: "确认本季度三个目标：AP Chem 保持 90+、找到 UBC 研究机会、提交 SHAD 申请。",
    decisions: ["本季度不报 AMC，集中精力 SHAD"],
    tasks: [
      { id: 11, text: "列出 5 个感兴趣的 UBC 实验室", owner: "student", due: "2026/10/3", done: true },
      { id: 12, text: "SHAD 文书初稿", owner: "student", due: "2026/10/17", done: true },
    ],
    teamNote: "",
    emailed: "学生、家长",
  },
];

const SAMPLE_NOTES = `11/8 和 Evan 开会
- 王教授面谈顺利，同意冬季让他每周去实验室 4 小时，做水样数据整理
- SHAD 文书第三稿基本可以了，周四前交终稿
- AP Chem 期中 94 分
- 讨论了 Euclid，决定 12 月开始每周两套真题
- 妈妈问暑期项目，下次会议讨论
- Evan 最近睡得晚，提醒注意节奏`;

export default function MeetingsPreview({
  goals,
  onGoals,
}: {
  goals: Goal[];
  onGoals: (next: Goal[]) => void;
}) {
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL);
  const [openId, setOpenId] = useState<number | null>(2);
  const [dialog, setDialog] = useState(false);
  const [step, setStep] = useState<"notes" | "review">("notes");
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("2026-11-08");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [teamNote, setTeamNote] = useState("");
  const [mailStudent, setMailStudent] = useState(true);
  const [mailParent, setMailParent] = useState(false);
  const [savedNote, setSavedNote] = useState("");

  const last = meetings[0];

  const start = () => {
    setStep("notes");
    setTitle("");
    setNotes("");
    setDialog(true);
  };

  const organise = () => {
    setBusy(true);
    window.setTimeout(() => {
      setTitle(title || "研究机会落实 + SHAD 终稿");
      setSummary("王教授同意冬季让 Evan 每周去实验室 4 小时做水样数据整理；SHAD 文书第三稿基本定稿；AP Chem 期中 94 分；12 月起备赛 Euclid。");
      setDecisions(["冬季研究：王教授实验室，每周 4 小时", "Euclid 从 12 月开始，每周两套真题", "暑期项目下次会议讨论"]);
      setTasks([
        { id: Date.now() + 1, text: "提交 SHAD 申请终稿", owner: "student", due: "2026-11-12", done: false, include: true },
        { id: Date.now() + 2, text: "和王教授确认冬季实验室时间表", owner: "student", due: "2026-11-15", done: false, include: true },
        { id: Date.now() + 3, text: "整理 3 个暑期项目选项，下次会议讨论", owner: "counselor", due: "2026-11-22", done: false, include: true },
        { id: Date.now() + 4, text: "下载 Euclid 近 5 年真题", owner: "student", due: "2026-11-30", done: false, include: true },
      ]);
      const ubc = goals.find((g) => g.text.includes("UBC"));
      setSuggestions([
        ...(ubc && !ubc.done ? [{ id: 1, kind: "done" as const, goalId: ubc.id, text: ubc.text, apply: true }] : []),
        { id: 2, kind: "add", text: "12 月起每周两套 Euclid 真题", apply: true },
      ]);
      setTeamNote("Evan 最近睡得晚，提醒注意节奏；妈妈关心暑期项目。");
      setBusy(false);
      setStep("review");
    }, 1300);
  };

  const save = () => {
    const kept = tasks.filter((t) => t.include);
    const m: Meeting = {
      id: Date.now(),
      date: date.replace(/-/g, "/").replace(/\/0/g, "/"),
      title,
      summary,
      decisions,
      tasks: kept.map((t) => ({ ...t, due: t.due.replace(/-/g, "/").replace(/\/0/g, "/") })),
      teamNote,
      emailed: [mailStudent && "学生", mailParent && "家长"].filter(Boolean).join("、") || "未发送",
    };
    setMeetings((ms) => [m, ...ms]);
    setOpenId(m.id);
    let next = goals;
    for (const s of suggestions.filter((x) => x.apply)) {
      if (s.kind === "done") next = next.map((g) => (g.id === s.goalId ? { ...g, done: true } : g));
      else next = [...next, { id: Date.now() + s.id, text: s.text, done: false }];
    }
    onGoals(next);
    const studentTasks = kept.filter((t) => t.owner === "student").length;
    setSavedNote(
      `已保存。${studentTasks} 项任务已加入学生待办${suggestions.some((s) => s.apply) ? "，季度目标已更新" : ""}${m.emailed !== "未发送" ? `，会议纪要已发邮件给${m.emailed}` : ""}。`,
    );
    window.setTimeout(() => setSavedNote(""), 6000);
    setDialog(false);
  };

  const toggleTask = (mid: number, tid: number) =>
    setMeetings((ms) => ms.map((m) => (m.id === mid ? { ...m, tasks: m.tasks.map((t) => (t.id === tid ? { ...t, done: !t.done } : t)) } : m)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">本季度已开会 {meetings.length} 次 · 任务完成 {meetings.flatMap((m) => m.tasks).filter((t) => t.done).length}/{meetings.flatMap((m) => m.tasks).length}</p>
        <Button onClick={start}><Plus className="mr-1.5 h-4 w-4" /> 记录会议</Button>
      </div>

      {savedNote && (
        <p className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-primary"><Check className="h-4 w-4" /> {savedNote}</p>
      )}

      <ul className="space-y-2">
        {meetings.map((m) => {
          const open = openId === m.id;
          const doneN = m.tasks.filter((t) => t.done).length;
          return (
            <li key={m.id} className="rounded-md border bg-card">
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenId(open ? null : m.id)}>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
                <span className="w-20 shrink-0 text-xs text-muted-foreground">{m.date}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">任务 {doneN}/{m.tasks.length}</span>
              </button>
              {open && (
                <div className="space-y-4 border-t px-4 py-4 text-sm">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">会议摘要</p>
                    <p className="leading-relaxed">{m.summary}</p>
                  </div>
                  {m.decisions.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">决定事项</p>
                      <ul className="space-y-1">{m.decisions.map((d) => <li key={d} className="pl-4 before:-ml-3 before:mr-1.5 before:content-['•']">{d}</li>)}</ul>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">任务</p>
                    <ul className="divide-y rounded-md border">
                      {m.tasks.map((t) => (
                        <li key={t.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                          <Checkbox checked={t.done} onCheckedChange={() => toggleTask(m.id, t.id)} />
                          <span className={cn("min-w-0 flex-1", t.done && "text-muted-foreground line-through")}>{t.text}</span>
                          <Badge variant="outline" className="font-normal">{OWNER[t.owner]}</Badge>
                          <span className="w-20 text-right text-xs text-muted-foreground">{t.due}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {m.teamNote && (
                    <div className="rounded-md border border-dashed bg-muted/30 p-3">
                      <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Lock className="h-3 w-3" /> 团队备注 · 学生看不到</p>
                      <p>{m.teamNote}</p>
                    </div>
                  )}
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" /> 会议纪要邮件：{m.emailed}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{step === "notes" ? "记录会议" : "确认会议整理结果"}</DialogTitle>
          </DialogHeader>

          {step === "notes" ? (
            <div className="space-y-4 text-sm">
              {last && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5" /> 上次会议（{last.date}）的任务，先回顾一下
                  </p>
                  <ul className="space-y-1">
                    {last.tasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-2">
                        <Checkbox checked={t.done} onCheckedChange={() => toggleTask(last.id, t.id)} />
                        <span className={cn("flex-1", t.done && "text-muted-foreground line-through")}>{t.text}</span>
                        <span className="text-xs text-muted-foreground">{OWNER[t.owner]} · {t.due}</span>
                        {!t.done && overdue(t.due) && <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">已逾期</Badge>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <div className="space-y-1.5"><Label>会议日期</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>主题（可不填，AI 会起）</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：研究机会落实" /></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>会议记录</Label>
                  <button className="text-xs text-primary hover:underline" onClick={() => setNotes(SAMPLE_NOTES)}>填入示例记录</button>
                </div>
                <Textarea rows={8} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="粘贴手写笔记、腾讯会议 / Zoom / 飞书的会议纪要，越随意越好，AI 会帮你整理" />
                <p className="text-xs text-muted-foreground">也可以上传 Word 或 txt 文件。</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-sm">
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <div className="space-y-1.5"><Label>会议日期</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>主题</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              </div>
              <div className="space-y-1.5">
                <Label>会议摘要 <span className="font-normal text-muted-foreground">· 学生可见</span></Label>
                <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>决定事项</Label>
                <ul className="space-y-1.5">
                  {decisions.map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <Input value={d} onChange={(e) => setDecisions(decisions.map((x, j) => (j === i ? e.target.value : x)))} />
                      <Button variant="ghost" size="icon" aria-label="删除" onClick={() => setDecisions(decisions.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <Label>任务 <span className="font-normal text-muted-foreground">· 勾选的会加入待办清单，到期前自动提醒</span></Label>
                <ul className="divide-y rounded-md border">
                  {tasks.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                      <Checkbox checked={t.include} onCheckedChange={(v) => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, include: !!v } : x)))} />
                      <Input className="h-8 min-w-[200px] flex-1" value={t.text} onChange={(e) => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)))} />
                      <Select value={t.owner} onValueChange={(v) => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, owner: v as Owner } : x)))}>
                        <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>{(Object.keys(OWNER) as Owner[]).map((o) => <SelectItem key={o} value={o}>{OWNER[o]}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="date" className="h-8 w-36" value={t.due} onChange={(e) => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, due: e.target.value } : x)))} />
                    </li>
                  ))}
                </ul>
              </div>
              {suggestions.length > 0 && (
                <div className="space-y-1.5">
                  <Label>季度目标 <span className="font-normal text-muted-foreground">· AI 建议，勾选才会生效</span></Label>
                  <ul className="space-y-1.5 rounded-md border bg-primary/5 p-3">
                    {suggestions.map((s) => (
                      <li key={s.id} className="flex items-start gap-2">
                        <Checkbox className="mt-0.5" checked={s.apply} onCheckedChange={(v) => setSuggestions(suggestions.map((x) => (x.id === s.id ? { ...x, apply: !!v } : x)))} />
                        <span>{s.kind === "done" ? <>标为完成：<b>{s.text}</b></> : <>新增目标：<b>{s.text}</b></>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> 团队备注 <span className="font-normal text-muted-foreground">· 只有服务团队能看到</span></Label>
                <Textarea rows={2} value={teamNote} onChange={(e) => setTeamNote(e.target.value)} />
              </div>
              <div className="flex flex-wrap items-center gap-4 rounded-md bg-muted/40 px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-4 w-4" /> 发送会议纪要（摘要 + 决定 + 任务）：</span>
                <label className="flex items-center gap-2"><Checkbox checked={mailStudent} onCheckedChange={(v) => setMailStudent(!!v)} /> 学生</label>
                <label className="flex items-center gap-2"><Checkbox checked={mailParent} onCheckedChange={(v) => setMailParent(!!v)} /> 家长</label>
              </div>
            </div>
          )}

          <DialogFooter>
            {step === "notes" ? (
              <>
                <Button variant="ghost" onClick={() => setDialog(false)}>取消</Button>
                <Button onClick={organise} disabled={!notes.trim() || busy}>
                  {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />} AI 整理
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setStep("notes")}>返回修改记录</Button>
                <Button onClick={save}>保存</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
