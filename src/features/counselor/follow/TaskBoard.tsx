import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, ChevronDown, ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTodoReminder } from "@/hooks/todos/useTodoReminder";
import { cn } from "@/lib/utils";
import { addTask, isOverdue, loadTasks, removeTask, setTaskDone, sortTasks, type UnifiedTask } from "./followData";
import { useOwnerLabels, type Owner } from "./meetings";

type Filter = "all" | Owner;

/** Every task for this student — the student's, the counselor's and the parent's — in one list. */
export default function TaskBoard({ studentId }: { studentId: string }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const OWNER = useOwnerLabels();
  const qc = useQueryClient();
  const key = ["follow-tasks", studentId];
  const { data: tasks = [], isLoading } = useQuery({ queryKey: key, queryFn: () => loadTasks(studentId) });
  const { sendReminder, isLoading: reminding } = useTodoReminder(studentId);

  const [filter, setFilter] = useState<Filter>("all");
  const [showDone, setShowDone] = useState(false);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<Owner>("student");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["student-todos", studentId] });
    qc.invalidateQueries({ queryKey: ["cs-upcoming", studentId] });
    qc.invalidateQueries({ queryKey: ["follow-meetings", studentId] });
  };

  const sorted = useMemo(() => sortTasks(tasks), [tasks]);
  const inFilter = (t: UnifiedTask) => filter === "all" || t.owner === filter;
  const open = sorted.filter((t) => !t.completed && inFilter(t));
  const done = sorted.filter((t) => t.completed && inFilter(t));
  const count = (o: Filter) => tasks.filter((t) => !t.completed && (o === "all" || t.owner === o)).length;
  const overdueN = tasks.filter(isOverdue).length;

  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await addTask(studentId, owner, title.trim(), due || null);
      setTitle("");
      setDue("");
      refresh();
    } catch {
      toast.error(L("没能添加任务", "Couldn't add the task"));
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (t: UnifiedTask) => {
    try {
      await setTaskDone(t, !t.completed);
    } catch {
      toast.error(L("没能更新任务", "Couldn't update the task"));
    }
    refresh();
  };
  const remove = async (t: UnifiedTask) => {
    if (!window.confirm(L(`删除任务「${t.title}」？`, `Delete "${t.title}"?`))) return;
    try {
      await removeTask(t);
    } catch {
      toast.error(L("删除失败", "Couldn't delete"));
    }
    refresh();
  };

  const sourceChip = (t: UnifiedTask) =>
    t.source.kind === "meeting" ? L(`会议 ${t.source.label}`, `Meeting ${t.source.label}`)
      : t.source.kind === "keydate" ? L("关键日期", "Key date") : null;

  const fmtDue = (d: string | null) => (d ? d.slice(5).replace("-", "/") : "");

  const row = (t: UnifiedTask) => (
    <li key={t.key} className="group flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
      <Checkbox checked={t.completed} onCheckedChange={() => void toggle(t)} aria-label={t.title} />
      <span className={cn("min-w-0 flex-1 text-sm", t.completed && "text-muted-foreground line-through")}>{t.title}</span>
      {sourceChip(t) && <span className="hidden max-w-[12rem] truncate text-xs text-muted-foreground sm:inline">{sourceChip(t)}</span>}
      <Badge variant="outline" className={cn("font-normal", t.owner === "counselor" && "border-primary/40 text-primary", t.owner === "parent" && "border-brass/50 text-brass")}>
        {OWNER[t.owner]}
      </Badge>
      <span className={cn("w-12 text-right text-xs tabular-nums", isOverdue(t) ? "font-medium text-destructive" : "text-muted-foreground")}>{fmtDue(t.due)}</span>
      <button className="text-muted-foreground opacity-0 hover:text-destructive focus:opacity-100 group-hover:opacity-100" aria-label={L("删除", "Delete")} onClick={() => void remove(t)}>
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-primary" /> {L("任务清单", "Tasks")}
            <span className="text-sm font-normal text-muted-foreground">
              {L(`未完成 ${count("all")}`, `${count("all")} open`)}{overdueN > 0 && <span className="text-destructive"> · {L(`逾期 ${overdueN}`, `${overdueN} overdue`)}</span>}
            </span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => void sendReminder()} disabled={reminding}>
            {reminding ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <BellRing className="mr-1.5 h-4 w-4" />}{L("提醒学生", "Remind student")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1" role="tablist">
          {(["all", "student", "counselor", "parent"] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={cn("rounded-full border px-3 py-1 text-xs", filter === f ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {f === "all" ? L("全部", "All") : OWNER[f]} {count(f)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : open.length === 0 ? (
          <p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">{L("没有未完成的任务。", "Nothing open.")}</p>
        ) : (
          <ul className="divide-y rounded-md border">{open.map(row)}</ul>
        )}

        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
          <Input className="min-w-[200px] flex-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L("添加任务，回车保存", "Add a task, press Enter")} />
          <Select value={owner} onValueChange={(v) => setOwner(v as Owner)}>
            <SelectTrigger className="w-24" aria-label={L("负责人", "Owner")}><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(OWNER) as Owner[]).map((o) => <SelectItem key={o} value={o}>{OWNER[o]}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" className="w-[9.5rem]" value={due} onChange={(e) => setDue(e.target.value)} aria-label={L("截止日期", "Due date")} />
          <Button type="submit" disabled={!title.trim() || busy}><Plus className="mr-1 h-4 w-4" />{L("添加", "Add")}</Button>
        </form>
        <p className="text-xs text-muted-foreground">
          {L("学生的任务会出现在学生首页并按时提醒；这里手动添加的顾问、家长任务只有服务团队能看到。", "Student tasks show on the student's home page with reminders; counselor and parent tasks added here are visible to the team only.")}
        </p>

        {done.length > 0 && (
          <div>
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showDone && "rotate-180")} /> {L(`已完成 ${done.length}`, `${done.length} done`)}
            </button>
            {showDone && <ul className="mt-2 divide-y rounded-md border">{done.map(row)}</ul>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
