import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StudentRecordsSheet from "./StudentRecordsSheet";
import ReschedulePopover from "@/features/counselor/follow/ReschedulePopover";
import LinkCounselorPrompt from "./LinkCounselor";
import { countMeetings, getCurrentPlanDoc, getOpenUploadRequest, getSharedFolder, listPublishedReports } from "@/shared/studentApi";
import { toast } from "sonner";
import {
  BarChart3,
  CalendarClock, ChevronDown, Download, ExternalLink, FileText, FolderOpen, Globe, LogOut, Menu,
  NotebookPen, Pencil, Plus, Trash2, Upload, User, Video, FileUser,
  HelpCircle,
} from "lucide-react";
import { GuideButton, Tour, useGuide } from "@/features/guide/Tour";
import { STUDENT_HOME_GUIDE } from "@/features/guide/guides";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useProfile } from "@/hooks/useProfile";
import { useStudentTodos } from "@/hooks/todos/useStudentTodos";
import type { Todo } from "@/hooks/todos/useTodoQuery";
import { useStudentQuarters } from "@/components/engines/hooks/useStudentQuarters";
import SharedFolderDialog from "@/components/college-planning/SharedFolderDialog";
import StudentResumeForm from "@/components/student/resume/StudentResumeForm";
import StudentReportCards from "@/features/grades/StudentReportCards";
import { REPORT_CARD_ACCEPT, ReportCardError, db, uploadReportCard, type UploadRequest } from "@/features/grades/reportCards";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MessageKey } from "@/i18n/translations";
import { isSafeHttpUrl } from "@/lib/safeUrl";

const DAY = 24 * 60 * 60 * 1000;

function currentAcademicYear() {
  const now = new Date();
  const y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

function currentQuarter() {
  const m = new Date().getMonth();
  if (m >= 8 && m <= 10) return "Q1_fall";
  if (m >= 11 || m <= 1) return "Q2_winter";
  if (m >= 2 && m <= 4) return "Q3_spring";
  return "Q4_summer";
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dueTime(due: string | null | undefined): number | null {
  if (!due) return null;
  const d = new Date(due.length <= 10 ? `${due}T00:00:00` : due);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

type Goal = { id: string; text: string; completed: boolean; from?: string; carried?: boolean };
type Doc = { id: string; title: string; content: string | null; file_path: string | null; file_name: string | null; source_url: string | null; updated_at: string };

/** One item in the "to do" list: a to-do, a quarter goal, or an upload request. */
type Item =
  | { kind: "todo"; key: string; title: string; done: boolean; due: number | null; todo: Todo }
  | { kind: "goal"; key: string; title: string; done: boolean; due: null; goal: Goal };

/**
 * The student's whole home: where they are this quarter, what to do, and
 * what their counselor has shared. Everything else lives in the menu.
 * Planning settings (stage, notes, engines) are for the counselor team only.
 */
export default function StudentHome({ studentId }: { studentId: string }) {
  const guide = useGuide("student-home", studentId);
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { todos, createTodo, toggleTodoStatus, deleteTodo } = useStudentTodos(studentId);
  const { quarters } = useStudentQuarters(studentId);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [panel, setPanel] = useState<"grades" | "resume" | null>(null);
  const [dialog, setDialog] = useState<"doc" | "folder" | null>(null);
  const [uploading, setUploading] = useState(false);

  // ---- this quarter ----
  const quarterKey = currentQuarter();
  const quarterRow = quarters.find((q) => q.quarter === quarterKey && q.academic_year === currentAcademicYear());
  const { goals, tickable } = useMemo(() => {
    try {
      const parsed = JSON.parse(quarterRow?.quarter_kpi || "[]");
      if (Array.isArray(parsed)) return { goals: parsed as Goal[], tickable: true };
    } catch {
      /* plain text goals are read-only */
    }
    const lines = (quarterRow?.quarter_kpi || "").split("\n").map((l) => l.replace(/^[•\-\s]+/, "").trim()).filter(Boolean);
    return { goals: lines.map((text, i) => ({ id: `line-${i}`, text, completed: false })), tickable: false };
  }, [quarterRow?.quarter_kpi]);
  const goalsDone = goals.filter((g) => g.completed).length;

  // ---- shared by the counselor ----
  const { data: latestDoc } = useQuery({
    queryKey: ["student-home-doc", studentId],
    queryFn: () => getCurrentPlanDoc(supabase, studentId),
  });
  const { data: hasReports = false } = useQuery({
    queryKey: ["student-home-report", studentId],
    queryFn: async () => (await listPublishedReports(supabase, studentId)).length > 0,
  });
  const { data: meetingCount = 0 } = useQuery({
    queryKey: ["student-home-meetings", studentId],
    queryFn: () => countMeetings(supabase, studentId),
  });
  const [records, setRecords] = useState<"meetings" | "reports" | null>(null);
  const { data: folder } = useQuery({
    queryKey: ["shared-folder", studentId],
    queryFn: () => getSharedFolder(supabase, studentId),
  });
  const { data: request } = useQuery({
    queryKey: ["report-request", studentId],
    queryFn: () => getOpenUploadRequest(supabase, studentId),
  });
  const folderUrl = folder && isSafeHttpUrl(folder.folder_url) ? folder.folder_url : null;

  // ---- which to-dos the team assigned, and pending extension requests ----
  const { data: assignment } = useQuery({
    queryKey: ["student-todo-assignment", studentId],
    queryFn: async () => {
      const db = supabase as never as { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any
      const [{ data: links }, { data: reqs }] = await Promise.all([
        db.from("meeting_action_items").select("todo_id").eq("student_id", studentId).not("todo_id", "is", null),
        db.from("task_extension_requests").select("id, todo_id, requested_due, status").eq("student_id", studentId).eq("status", "pending"),
      ]);
      return {
        fromMeetings: new Set(((links || []) as { todo_id: string }[]).map((l) => l.todo_id)),
        pending: new Map(((reqs || []) as { todo_id: string; requested_due: string }[]).map((r) => [r.todo_id, r.requested_due])),
      };
    },
  });
  const isAssigned = (todo: { id: string; title: string; assigned_by?: string | null }) =>
    !!todo.assigned_by || todo.title.startsWith("📌") || !!assignment?.fromMeetings.has(todo.id);
  const refreshTodos = () => {
    queryClient.invalidateQueries({ queryKey: ["student-todos", studentId] });
    queryClient.invalidateQueries({ queryKey: ["todos"] });
    queryClient.invalidateQueries({ queryKey: ["student-todo-assignment", studentId] });
  };
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [todoDraft, setTodoDraft] = useState("");
  const [todoDueDraft, setTodoDueDraft] = useState("");
  const saveTodo = async (todo: { id: string; title: string; due_date?: string | null }) => {
    const text = todoDraft.trim();
    const oldDue = todo.due_date ? String(todo.due_date).slice(0, 10) : "";
    setEditingTodo(null);
    try {
      if (text && text !== todo.title) {
        const { error } = await supabase.from("todos").update({ title: text.slice(0, 300) } as never).eq("id", todo.id);
        if (error) throw error;
      }
      if (todoDueDraft !== oldDue) {
        const { error } = await (supabase as never as { rpc: (n: string, a: object) => Promise<{ error: unknown }> })
          .rpc("reschedule_task", { p_table: "todos", p_task_id: todo.id, p_due: todoDueDraft || null, p_reason: null });
        if (error) throw error;
      }
    } catch {
      toast.error(lang === "zh" ? "没能保存修改" : "Couldn't save");
    }
    refreshTodos();
  };
  const requestExtension = async (todo: { id: string; due_date?: string | null }, due: string, reason: string) => {
    const { error } = await (supabase as never as { from: (t: string) => { insert: (r: object) => Promise<{ error: unknown }> } })
      .from("task_extension_requests")
      .insert({ student_id: studentId, status: "pending", todo_id: todo.id, current_due: todo.due_date ? String(todo.due_date).slice(0, 10) : null, requested_due: due, reason });
    if (error) {
      toast.error(lang === "zh" ? "没能提交申请" : "Couldn't send the request");
      return;
    }
    toast.success(lang === "zh" ? "已提交延期申请，等待顾问确认" : "Request sent to your counselor");
    refreshTodos();
  };

  // ---- one list ----
  const { open, done } = useMemo(() => {
    const items: Item[] = [
      ...todos.map((todo): Item => ({ kind: "todo", key: `t-${todo.id}`, title: todo.title.replace(/^📌\s*/u, ""), done: !!todo.completed, due: dueTime(todo.due_date), todo })),
      ...goals.map((goal): Item => ({ kind: "goal", key: `g-${goal.id}`, title: goal.text, done: !!goal.completed, due: null, goal })),
    ];
    const rank = (i: Item) => (i.due !== null ? 0 : i.kind === "goal" ? 1 : 2);
    const sorted = items.sort((a, b) => rank(a) - rank(b) || (a.due ?? 0) - (b.due ?? 0));
    return { open: sorted.filter((i) => !i.done), done: sorted.filter((i) => i.done) };
  }, [todos, goals]);

  // Students may add, tick and reword goals; deleting is for the counselor team
  // (the database enforces this too).
  const saveGoals = async (next: Goal[]) => {
    if (!tickable) return false;
    const kpi = JSON.stringify(next);
    const { error } = quarterRow
      ? await supabase.from("student_quarters").update({ quarter_kpi: kpi } as never).eq("id", quarterRow.id)
      : await supabase.from("student_quarters").insert({ student_id: studentId, quarter: quarterKey, academic_year: currentAcademicYear(), quarter_kpi: kpi } as never);
    queryClient.invalidateQueries({ queryKey: ["student-quarters", studentId] });
    if (error) {
      toast.error(t("home.goalSaveFailed"));
      return false;
    }
    return true;
  };
  const toggleGoal = (goal: Goal) => void saveGoals(goals.map((g) => (g.id === goal.id ? { ...g, completed: !g.completed } : g)));
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [goalDraft, setGoalDraft] = useState("");
  const renameGoal = async (goal: Goal) => {
    const text = goalDraft.trim();
    setEditingGoal(null);
    if (!text || text === goal.text) return;
    await saveGoals(goals.map((g) => (g.id === goal.id ? { ...g, text: text.slice(0, 300) } : g)));
  };
  const [addAs, setAddAs] = useState<"todo" | "goal">("todo");

  const toggle = (item: Item) =>
    item.kind === "todo"
      ? toggleTodoStatus.mutate({ id: item.todo.id, completed: !item.todo.completed })
      : toggleGoal(item.goal);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (addAs === "goal") {
      const ok = await saveGoals([...goals, { id: `kpi-s-${Date.now()}`, text: title.trim().slice(0, 300), completed: false }]);
      if (ok) setTitle("");
      return;
    }
    await createTodo.mutateAsync({ title: title.trim(), authorId: studentId, due_date: due || undefined });
    setTitle("");
    setDue("");
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await uploadReportCard(studentId, file);
      toast.success(t("grades.uploaded"));
      queryClient.invalidateQueries({ queryKey: ["report-request", studentId] });
      queryClient.invalidateQueries({ queryKey: ["report-cards", studentId] });
    } catch (err) {
      const reason = err instanceof ReportCardError ? err.message : "";
      toast.error(reason === "type" ? t("grades.badType") : reason === "size" ? t("grades.tooBig") : t("grades.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const saveFolder = async (data: { title: string; folder_url: string; description?: string }) => {
    if (!isSafeHttpUrl(data.folder_url)) {
      toast.error(t("home.folderBadUrl"));
      return;
    }
    const { error } = await supabase.from("shared_folders").upsert({ id: folder?.id, created_by: studentId, ...data });
    if (error) {
      toast.error(t("home.folderSaveFailed"));
      return;
    }
    setDialog(null);
    queryClient.invalidateQueries({ queryKey: ["shared-folder", studentId] });
  };

  const downloadDoc = async (doc: Doc) => {
    if (!doc.file_path) return;
    const { data, error } = await supabase.storage.from("planning-documents").download(doc.file_path);
    if (error || !data) {
      toast.error(t("home.downloadFailed"));
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name || "plan";
    a.click();
    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const fmtDue = (time: number | null) => {
    if (time === null) return null;
    const diff = Math.round((time - startOfToday()) / DAY);
    if (diff === 0) return t("home.todo.today");
    if (diff === 1) return t("home.todo.tomorrow");
    return new Date(time).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-CA", { month: "short", day: "numeric" });
  };
  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-CA");
  const firstName = (profile?.full_name || "").trim().split(/\s+/)[0] || "";

  const row = (item: Item) => {
    const overdue = item.due !== null && item.due < startOfToday() && !item.done;
    return (
      <li key={item.key} className="group flex items-start gap-3 py-3">
        <Checkbox
          id={item.key}
          checked={item.done}
          disabled={item.kind === "goal" && !tickable}
          onCheckedChange={() => toggle(item)}
          className="mt-0.5"
        />
        {item.kind === "goal" && editingGoal === item.goal.id ? (
          <Input
            autoFocus
            value={goalDraft}
            maxLength={300}
            onChange={(e) => setGoalDraft(e.target.value)}
            onBlur={() => void renameGoal(item.goal)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void renameGoal(item.goal);
              if (e.key === "Escape") setEditingGoal(null);
            }}
            className="h-8 min-w-0 flex-1"
            aria-label={lang === "zh" ? "修改目标" : "Edit goal"}
          />
        ) : item.kind === "todo" && editingTodo === item.todo.id ? (
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <Input autoFocus value={todoDraft} maxLength={300} onChange={(e) => setTodoDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void saveTodo(item.todo); if (e.key === "Escape") setEditingTodo(null); }}
              className="h-8 min-w-[160px] flex-1" aria-label={lang === "zh" ? "修改待办" : "Edit to-do"} />
            <Input type="date" value={todoDueDraft} onChange={(e) => setTodoDueDraft(e.target.value)} className="h-8 w-[9.5rem]" aria-label={lang === "zh" ? "截止日期" : "Due date"} />
            <Button size="sm" className="h-8" onClick={() => void saveTodo(item.todo)}>{lang === "zh" ? "保存" : "Save"}</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingTodo(null)}>{lang === "zh" ? "取消" : "Cancel"}</Button>
          </div>
        ) : (
          <label htmlFor={item.key} className={`min-w-0 flex-1 leading-snug ${item.done ? "text-muted-foreground line-through" : ""}`}>
            {item.title}
            {item.kind === "goal" && <span className="ml-2 text-xs text-primary">{t("home3.goalTag")}</span>}
            {item.kind === "goal" && item.goal.from && <span className="ml-2 text-xs text-muted-foreground">{lang === "zh" ? `顺延自 ${item.goal.from}` : `from ${item.goal.from}`}</span>}
            {item.kind === "todo" && !item.done && assignment?.pending.has(item.todo.id) && (
              <span className="ml-2 whitespace-nowrap rounded bg-brass/10 px-1.5 py-0.5 text-xs text-brass">
                {lang === "zh" ? `已申请延期至 ${assignment.pending.get(item.todo.id)!.slice(5).replace("-", "/")} · 等待顾问确认` : `Extension to ${assignment.pending.get(item.todo.id)} requested`}
              </span>
            )}
          </label>
        )}
        {item.due !== null && (
          <span className={`shrink-0 text-sm ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
            {overdue ? t("home3.overdue", { date: fmtDue(item.due) || "" }) : fmtDue(item.due)}
          </span>
        )}
        {item.kind === "goal" && tickable && editingGoal !== item.goal.id && (
          <button
            type="button"
            onClick={() => { setEditingGoal(item.goal.id); setGoalDraft(item.goal.text); }}
            className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label={lang === "zh" ? "修改目标" : "Edit goal"}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        {item.kind === "todo" && editingTodo !== item.todo.id && !item.done && isAssigned(item.todo) && !assignment?.pending.has(item.todo.id) && (
          <ReschedulePopover current={item.todo.due_date ? String(item.todo.due_date).slice(0, 10) : null} reasonRequired
            title={lang === "zh" ? "申请延期" : "Ask for more time"} confirmLabel={lang === "zh" ? "提交申请" : "Send request"}
            onConfirm={(d, r) => requestExtension(item.todo, d, r)}>
            <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground" title={lang === "zh" ? "这是顾问布置的任务，改期需要顾问同意" : "Assigned by your counselor; changing the date needs their OK"}>
              <CalendarClock className="mr-0.5 inline h-4 w-4" />{lang === "zh" ? "申请延期" : "Extend"}
            </button>
          </ReschedulePopover>
        )}
        {item.kind === "todo" && editingTodo !== item.todo.id && !isAssigned(item.todo) && (
          <button
            type="button"
            onClick={() => { setEditingTodo(item.todo.id); setTodoDraft(item.todo.title); setTodoDueDraft(item.todo.due_date ? String(item.todo.due_date).slice(0, 10) : ""); }}
            className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label={lang === "zh" ? "修改待办" : "Edit to-do"}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        {item.kind === "todo" && editingTodo !== item.todo.id && !isAssigned(item.todo) && (
          <button
            type="button"
            onClick={() => deleteTodo.mutate(item.todo.id)}
            className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
            aria-label={t("home.todo.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </li>
    );
  };

  const shared = [
    latestDoc && { key: "doc", icon: FileText, label: t("home.planDoc"), onClick: () => setDialog("doc") },
    meetingCount > 0 && { key: "meetings", icon: NotebookPen, label: lang === "zh" ? "会议纪要" : "Meeting notes", onClick: () => setRecords("meetings") },
    hasReports && { key: "report", icon: BarChart3, label: lang === "zh" ? "规划报告" : "Planning reports", onClick: () => setRecords("reports") },
    folderUrl && { key: "folder", icon: FolderOpen, label: t("plan.folder.title"), href: folderUrl },
  ].filter(Boolean) as { key: string; icon: typeof FileText; label: string; onClick?: () => void; href?: string }[];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
      <input ref={uploadRef} type="file" accept={REPORT_CARD_ACCEPT} className="hidden" onChange={onUpload} />

      {/* Header */}
      <Tour steps={STUDENT_HOME_GUIDE} open={guide.open} onClose={guide.close} />
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0" data-tour="student-progress">
          <h1 className="font-serif text-3xl font-semibold text-pine">{t("home3.hello", { name: firstName })}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`plan.quarter.${quarterKey}` as MessageKey)}
            {goals.length > 0 && ` · ${t("home3.goalsLine", { done: goalsDone, total: goals.length })}`}
          </p>
          {goals.length > 0 && (
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className="h-full bg-primary transition-all" style={{ width: `${(goalsDone / goals.length) * 100}%` }} />
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <GuideButton onClick={guide.start} className="hidden sm:inline-flex" />
          {/* Mock interview opens in its own tab so the home page stays put. */}
          <Button variant="outline" size="sm" asChild data-tour="mock-interview-button">
            <a href="/mock-interview" target="_blank" rel="noopener noreferrer">
              <Video className="mr-1.5 h-4 w-4" /> {t("dash.mockInterview")}
            </a>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("home3.menu")} data-tour="student-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="sm:hidden" onSelect={guide.start}><HelpCircle className="mr-2 h-4 w-4" />{lang === "zh" ? "使用指南" : "Guide"}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setPanel("grades")}><Upload className="mr-2 h-4 w-4" />{t("grades.tab")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setPanel("resume")}><FileUser className="mr-2 h-4 w-4" />{t("dash.info.resume")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog("folder")}><FolderOpen className="mr-2 h-4 w-4" />{folderUrl ? t("plan.folder.edit") : t("plan.folder.add")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/student-profile")}><User className="mr-2 h-4 w-4" />{t("dash.profile")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLang(lang === "zh" ? "en" : "zh")}><Globe className="mr-2 h-4 w-4" />{lang === "zh" ? "English" : "中文"}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void logout()}><LogOut className="mr-2 h-4 w-4" />{t("dash.logout")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <LinkCounselorPrompt studentId={studentId} />

      {/* To do */}
      <section className="mt-10" aria-labelledby="todo-heading" data-tour="student-todo">
        <h2 id="todo-heading" className="font-serif text-xl font-semibold text-pine">{t("home3.todo")}</h2>

        {request && (
          <div className="mt-3 flex items-center gap-3 rounded-md border border-brass/40 bg-brass/10 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t("home3.uploadAsk", { date: request.due_date })}</p>
              {request.message && <p className="mt-0.5 text-sm text-foreground/80">{request.message}</p>}
            </div>
            <Button size="sm" disabled={uploading} onClick={() => uploadRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" /> {t("home3.upload")}
            </Button>
          </div>
        )}

        {open.length === 0 ? (
          <p className="py-6 text-muted-foreground">{t("home.todo.empty")}</p>
        ) : (
          <ul className="mt-2 divide-y">{open.map(row)}</ul>
        )}

        <form onSubmit={add} className="mt-2 flex gap-2" data-tour="student-add">
          <Input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={addAs === "goal" ? (lang === "zh" ? "添加一个本季目标" : "Add a goal for this quarter") : t("home.todo.placeholder")}
            aria-label={addAs === "goal" ? (lang === "zh" ? "添加本季目标" : "Add a quarter goal") : t("home.todo.placeholder")} />
          {addAs === "todo" && (
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label={t("home.todo.dueDate")} className="w-[9.5rem] shrink-0" />
          )}
          <Button type="submit" size="icon" className="shrink-0" disabled={!title.trim() || createTodo.isPending} aria-label={t("home.todo.add")}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        {tickable && (
          <div className="mt-1.5 flex gap-1 text-xs" role="radiogroup" aria-label={lang === "zh" ? "添加为" : "Add as"}>
            {(["todo", "goal"] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={addAs === k} onClick={() => setAddAs(k)}
                className={`rounded-full px-2.5 py-0.5 ${addAs === k ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {k === "todo" ? (lang === "zh" ? "待办" : "To-do") : (lang === "zh" ? "本季目标" : "Quarter goal")}
              </button>
            ))}
          </div>
        )}

        {done.length > 0 && (
          <div className="mt-4">
            <button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-4 w-4 transition-transform ${showDone ? "rotate-180" : ""}`} />
              {t("home.todo.done", { n: done.length })}
            </button>
            {showDone && <ul className="divide-y">{done.map(row)}</ul>}
          </div>
        )}
      </section>

      {/* From the counselor */}
      {shared.length > 0 && (
        <section className="mt-10" aria-labelledby="shared-heading" data-tour="student-shared">
          <h2 id="shared-heading" className="font-serif text-xl font-semibold text-pine">{t("home3.shared")}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {shared.map((s) =>
              s.href ? (
                <Button key={s.key} variant="outline" className="h-12 justify-start" asChild>
                  <a href={s.href} target="_blank" rel="noopener noreferrer"><s.icon className="mr-2 h-4 w-4" />{s.label}</a>
                </Button>
              ) : (
                <Button key={s.key} variant="outline" className="h-12 justify-start" onClick={s.onClick}>
                  <s.icon className="mr-2 h-4 w-4" />{s.label}
                </Button>
              ),
            )}
          </div>
        </section>
      )}

      {/* Menu panels */}
      <Sheet open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="font-serif text-pine">
              {panel === "grades" ? t("grades.tab") : t("dash.info.resume")}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {panel === "grades" && <StudentReportCards studentId={studentId} />}
            {panel === "resume" && <StudentResumeForm />}
          </div>
        </SheetContent>
      </Sheet>

      {/* Planning document */}
      <Dialog open={dialog === "doc"} onOpenChange={(o) => setDialog(o ? "doc" : null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {latestDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-pine">{latestDoc.title}</DialogTitle>
                <p className="text-xs text-muted-foreground">{t("home.updatedOn", { date: dateFmt(latestDoc.updated_at) })}</p>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                {latestDoc.source_url && isSafeHttpUrl(latestDoc.source_url) && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={latestDoc.source_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />{t("plan.docs.openInDrive")}</a>
                  </Button>
                )}
                {latestDoc.file_path && (
                  <Button size="sm" variant="outline" onClick={() => void downloadDoc(latestDoc)}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />{t("home.download")}
                  </Button>
                )}
              </div>
              <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">{latestDoc.content || t("plan.docs.noContent")}</div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <StudentRecordsSheet studentId={studentId} kind={records} onClose={() => setRecords(null)} />

      <SharedFolderDialog open={dialog === "folder"} onOpenChange={(o) => setDialog(o ? "folder" : null)} onSubmit={saveFolder} initialData={folder || undefined} />
    </div>
  );
}
