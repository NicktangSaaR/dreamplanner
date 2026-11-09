import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CalendarClock, Check, ChevronDown, History, ListChecks, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
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
import {
  addTask, changeOwner, decideExtension, isOverdue, loadExtensionRequests, loadTasks, postponeSummary, removeTask, renameTask, rescheduleTask,
  setTaskDone, sortTasks, type UnifiedTask,
} from "./followData";
import ReschedulePopover from "./ReschedulePopover";
import { useOwnerLabels, type Owner } from "./meetings";

type Filter = "all" | Owner | "overdue";

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
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editOwner, setEditOwner] = useState<Owner>("student");
  const { data: requests = [] } = useQuery({ queryKey: ["follow-ext-requests", studentId], queryFn: () => loadExtensionRequests(studentId) });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["student-todos", studentId] });
    qc.invalidateQueries({ queryKey: ["cs-upcoming", studentId] });
    qc.invalidateQueries({ queryKey: ["follow-meetings", studentId] });
    qc.invalidateQueries({ queryKey: ["follow-ext-requests", studentId] });
  };

  const sorted = useMemo(() => sortTasks(tasks), [tasks]);
  const inFilter = (t: UnifiedTask) => filter === "all" || (filter === "overdue" ? isOverdue(t) : t.owner === filter);
  const open = sorted.filter((t) => !t.completed && inFilter(t));
  const done = sorted.filter((t) => t.completed && inFilter(t));
  const count = (o: Filter) => tasks.filter((t) => !t.completed && (o === "all" || (o === "overdue" ? isOverdue(t) : t.owner === o))).length;
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

  const reschedule = async (t: UnifiedTask, newDue: string, reason: string) => {
    try {
      await rescheduleTask(t.table, t.id, newDue, reason);
      toast.success(L(`已改到 ${newDue}`, `Moved to ${newDue}`));
    } catch {
      toast.error(L("没能改期", "Couldn't change the date"));
    }
    refresh();
  };
  const startEdit = (t: UnifiedTask) => {
    setEditing(t.key);
    setEditTitle(t.title);
    setEditOwner(t.owner);
  };
  const saveEdit = async (t: UnifiedTask) => {
    try {
      if (editTitle.trim() && editTitle.trim() !== t.title) await renameTask(t, editTitle.trim());
      if (editOwner !== t.owner) await changeOwner(studentId, { ...t, title: editTitle.trim() || t.title }, editOwner);
      setEditing(null);
    } catch {
      toast.error(L("没能保存修改", "Couldn't save"));
    }
    refresh();
  };
  const decide = async (id: string, approve: boolean) => {
    try {
      await decideExtension(id, approve);
      toast.success(approve ? L("已同意延期", "Extension approved") : L("已拒绝延期申请", "Extension declined"));
    } catch {
      toast.error(L("操作失败", "Couldn't update the request"));
    }
    refresh();
  };
  const fmtShort = (d: string | null) => (d ? d.slice(5, 10).replace("-", "/") : "");

  const sourceChip = (t: UnifiedTask) =>
    t.source.kind === "meeting" ? L(`会议 ${t.source.label}`, `Meeting ${t.source.label}`)
      : t.source.kind === "keydate" ? L("关键日期", "Key date") : null;

  const fmtDue = (d: string | null) => (d ? d.slice(5).replace("-", "/") : "");

  const row = (t: UnifiedTask) => {
    const ps = postponeSummary(t);
    if (editing === t.key) {
      return (
        <li key={t.key} className="flex flex-wrap items-center gap-2 bg-muted/30 px-3 py-2">
          <Input autoFocus className="h-8 min-w-[200px] flex-1" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void saveEdit(t); if (e.key === "Escape") setEditing(null); }} aria-label={L("任务内容", "Task")} />
          <Select value={editOwner} onValueChange={(v) => setEditOwner(v as Owner)}>
            <SelectTrigger className="h-8 w-24" aria-label={L("负责人", "Owner")}><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(OWNER) as Owner[]).map((o) => <SelectItem key={o} value={o}>{OWNER[o]}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" className="h-8" onClick={() => void saveEdit(t)}><Check className="mr-1 h-3.5 w-3.5" />{L("保存", "Save")}</Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(null)}>{L("取消", "Cancel")}</Button>
        </li>
      );
    }
    return (
      <li key={t.key} className="group flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
        <Checkbox checked={t.completed} onCheckedChange={() => void toggle(t)} aria-label={t.title} />
        <span className={cn("min-w-0 flex-1 text-sm", t.completed && "text-muted-foreground line-through")}>
          {t.title}
          {ps.times > 0 && (
            <span className="ml-2 inline-flex items-center gap-0.5 whitespace-nowrap rounded bg-brass/10 px-1.5 py-0.5 text-xs text-brass"
              title={t.history.map((h) => `${fmtShort(h.old_due)} → ${fmtShort(h.new_due)}${h.via === "request" ? L("（学生申请）", " (student request)") : h.via === "student" ? L("（学生改期）", " (student)") : ""}${h.reason ? `：${h.reason}` : ""}`).join("\n")}>
              <History className="h-3 w-3" />{L(`已延期 ${ps.times} 次 · 原定 ${fmtShort(ps.firstDue)}`, `Postponed ${ps.times}× · first due ${fmtShort(ps.firstDue)}`)}
            </span>
          )}
        </span>
        {sourceChip(t) && <span className="hidden max-w-[12rem] truncate text-xs text-muted-foreground sm:inline">{sourceChip(t)}</span>}
        <Badge variant="outline" className={cn("font-normal", t.owner === "counselor" && "border-primary/40 text-primary", t.owner === "parent" && "border-brass/50 text-brass")}>
          {OWNER[t.owner]}
        </Badge>
        <span className={cn("w-12 text-right text-xs tabular-nums", isOverdue(t) ? "font-medium text-destructive" : "text-muted-foreground")}>{fmtDue(t.due)}</span>
        {!t.completed && (
          <ReschedulePopover current={t.due} onConfirm={(d, r) => reschedule(t, d, r)} title={L("改期 / 延期", "Change date")}>
            <button className="text-muted-foreground hover:text-foreground" aria-label={L("改期", "Change date")} title={L("改期", "Change date")}>
              <CalendarClock className="h-4 w-4" />
            </button>
          </ReschedulePopover>
        )}
        <button className="text-muted-foreground opacity-0 hover:text-foreground focus:opacity-100 group-hover:opacity-100" aria-label={L("修改", "Edit")} onClick={() => startEdit(t)}>
          <Pencil className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground opacity-0 hover:text-destructive focus:opacity-100 group-hover:opacity-100" aria-label={L("删除", "Delete")} onClick={() => void remove(t)}>
          <Trash2 className="h-4 w-4" />
        </button>
      </li>
    );
  };

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
          {(["all", "student", "counselor", "parent", "overdue"] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={cn("rounded-full border px-3 py-1 text-xs", filter === f ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {f === "all" ? L("全部", "All") : f === "overdue" ? L("逾期", "Overdue") : OWNER[f]} {count(f)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length > 0 && (
          <div className="space-y-2 rounded-md border border-brass/40 bg-brass/10 p-3">
            <p className="text-sm font-medium">{L(`学生申请延期 ${requests.length} 条`, `${requests.length} extension request(s)`)}</p>
            <ul className="space-y-2">
              {requests.map((r) => {
                const task = tasks.find((t) => t.table === "todos" && t.id === r.todo_id);
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-2 rounded bg-background px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{task?.title || L("（任务）", "(task)")}</span>
                      <span className="text-muted-foreground"> · {fmtShort(r.current_due)} → <b className="text-foreground">{fmtShort(r.requested_due)}</b>{r.reason ? ` · ${r.reason}` : ""}</span>
                    </span>
                    <Button size="sm" className="h-7" onClick={() => void decide(r.id, true)}><Check className="mr-1 h-3.5 w-3.5" />{L("同意", "Approve")}</Button>
                    <Button size="sm" variant="outline" className="h-7" onClick={() => void decide(r.id, false)}><X className="mr-1 h-3.5 w-3.5" />{L("不同意", "Decline")}</Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
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
