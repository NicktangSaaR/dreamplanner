import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useStudentTodos } from "@/hooks/todos/useStudentTodos";
import type { Todo } from "@/hooks/todos/useTodoQuery";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MessageKey } from "@/i18n/translations";
import CalendarSection from "@/components/college-planning/CalendarSection";

const DAY = 24 * 60 * 60 * 1000;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Due dates are stored as dates or timestamps; compare by local calendar day. */
function dueTime(todo: Todo): number | null {
  if (!todo.due_date) return null;
  const d = new Date(todo.due_date.length <= 10 ? `${todo.due_date}T00:00:00` : todo.due_date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

type Group = "overdue" | "soon" | "later" | "undated";
const GROUPS: Group[] = ["overdue", "soon", "later", "undated"];

/**
 * To-dos as one plain list, grouped by when they are due: overdue, the next
 * 30 days, later, and no date. Completed items fold away at the bottom.
 */
export default function StudentTodoPanel({ studentId }: { studentId: string }) {
  const { t, lang } = useLanguage();
  const { todos, createTodo, toggleTodoStatus, deleteTodo } = useStudentTodos(studentId);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { groups, done } = useMemo(() => {
    const today = startOfToday();
    const g: Record<Group, Todo[]> = { overdue: [], soon: [], later: [], undated: [] };
    const doneList: Todo[] = [];
    for (const todo of todos) {
      if (todo.completed) {
        doneList.push(todo);
        continue;
      }
      const tt = dueTime(todo);
      if (tt === null) g.undated.push(todo);
      else if (tt < today) g.overdue.push(todo);
      else if (tt <= today + 30 * DAY) g.soon.push(todo);
      else g.later.push(todo);
    }
    for (const key of ["overdue", "soon", "later"] as Group[]) {
      g[key].sort((a, b) => (dueTime(a) ?? 0) - (dueTime(b) ?? 0));
    }
    return { groups: g, done: doneList };
  }, [todos]);

  const pendingCount = GROUPS.reduce((n, k) => n + groups[k].length, 0);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = title.trim();
    if (!text) return;
    await createTodo.mutateAsync({ title: text, authorId: studentId, due_date: due || undefined });
    setTitle("");
    setDue("");
  };

  const fmtDue = (todo: Todo) => {
    const tt = dueTime(todo);
    if (tt === null) return null;
    const diff = Math.round((tt - startOfToday()) / DAY);
    if (diff === 0) return t("home.todo.today");
    if (diff === 1) return t("home.todo.tomorrow");
    return new Date(tt).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-CA", { month: "short", day: "numeric" });
  };

  const row = (todo: Todo, group?: Group) => (
    <li key={todo.id} className="group flex items-start gap-3 py-2">
      <Checkbox
        id={`todo-${todo.id}`}
        checked={todo.completed}
        onCheckedChange={() => toggleTodoStatus.mutate({ id: todo.id, completed: !todo.completed })}
        className="mt-0.5"
      />
      <label
        htmlFor={`todo-${todo.id}`}
        className={`min-w-0 flex-1 text-sm leading-snug ${todo.completed ? "text-muted-foreground line-through" : ""}`}
      >
        {todo.title}
      </label>
      {fmtDue(todo) && (
        <span className={`shrink-0 text-xs ${group === "overdue" ? "font-medium text-destructive" : "text-muted-foreground"}`}>
          {fmtDue(todo)}
        </span>
      )}
      <button
        type="button"
        onClick={() => deleteTodo.mutate(todo.id)}
        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
        aria-label={t("home.todo.delete")}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-baseline justify-between font-serif text-xl text-pine">
          {t("home.todo.title")}
          <span className="font-sans text-sm font-normal text-muted-foreground">{t("home.todo.pending", { n: pendingCount })}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("home.todo.placeholder")}
            aria-label={t("home.todo.placeholder")}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              aria-label={t("home.todo.dueDate")}
              className="w-[9.5rem]"
            />
            <Button type="submit" size="icon" disabled={!title.trim() || createTodo.isPending} aria-label={t("home.todo.add")}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {pendingCount === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t("home.todo.empty")}</p>
        ) : (
          GROUPS.filter((k) => groups[k].length > 0).map((k) => (
            <section key={k}>
              <h4 className={`text-xs font-semibold uppercase tracking-wide ${k === "overdue" ? "text-destructive" : "text-muted-foreground"}`}>
                {t(`home.todo.group.${k}` as MessageKey)}
              </h4>
              <ul className="mt-1 divide-y">{groups[k].map((todo) => row(todo, k))}</ul>
            </section>
          ))
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          {done.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              aria-expanded={showDone}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showDone ? "rotate-180" : ""}`} />
              {t("home.todo.done", { n: done.length })}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <CalendarDays className="h-4 w-4" /> {t("home.todo.calendar")}
          </button>
        </div>
        {showDone && <ul className="divide-y">{done.map((todo) => row(todo))}</ul>}
      </CardContent>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-pine">{t("home.todo.calendar")}</DialogTitle>
          </DialogHeader>
          {calendarOpen && <CalendarSection />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
