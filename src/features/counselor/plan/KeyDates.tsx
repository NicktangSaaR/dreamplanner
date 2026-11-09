import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, FileSearch, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { quarterRange } from "@/shared/planning";
import { addKeyDate, loadKeyDates, removeKeyDate, updateKeyDate } from "@/features/counselor/follow/followData";
import { todayIso, type PlanDoc, type QuarterKey } from "./planData";

/**
 * Key dates (deadlines, exams, competition dates) that fall in this quarter.
 * The team gets an email a week before each one.
 */
export default function KeyDates({ studentId, quarter, year, currentDoc }: { studentId: string; quarter: QuarterKey; year: string; currentDoc: PlanDoc | null }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const qc = useQueryClient();
  const { from, to } = quarterRange(quarter, year);
  const key = ["plan-keydates", studentId, from];
  const { data: dates = [], isLoading } = useQuery({ queryKey: key, queryFn: () => loadKeyDates(studentId, from, to) });

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");
  const saveEdit = async () => {
    if (!editId || !editTitle.trim() || !editDue) return;
    try {
      await updateKeyDate(editId, { title: editTitle.trim(), due_date: editDue });
      setEditId(null);
      refresh();
    } catch {
      toast.error(L("没能保存", "Couldn't save"));
    }
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["plan-keydates", studentId] });
    qc.invalidateQueries({ queryKey: ["follow-tasks", studentId] });
    qc.invalidateQueries({ queryKey: ["cs-upcoming", studentId] });
  };

  const add = async () => {
    if (!title.trim() || !due) return;
    try {
      await addKeyDate(studentId, title.trim(), due);
      setTitle("");
      setDue("");
      setAdding(false);
      refresh();
    } catch {
      toast.error(L("没能添加", "Couldn't add"));
    }
  };

  const extract = async () => {
    if (!currentDoc?.content) return;
    if (!window.confirm(L(`从「${currentDoc.title}」里提取带日期的节点？会替换之前从这份方案提取的关键日期，并为学生生成对应任务。`,
      `Extract dated milestones from "${currentDoc.title}"? This replaces dates extracted from this plan before and adds matching student tasks.`))) return;
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-milestones", {
        body: { documentContent: currentDoc.content, documentId: currentDoc.id, studentId, reminderEmails: [] },
      });
      if (error) throw error;
      toast.success(L(`已提取 ${data?.milestonesCount ?? 0} 个关键日期`, `${data?.milestonesCount ?? 0} key dates extracted`));
      refresh();
    } catch {
      toast.error(L("提取失败，请稍后再试", "Couldn't extract. Please try again."));
    } finally {
      setExtracting(false);
    }
  };

  const today = todayIso();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Label className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" />{L("关键日期", "Key dates")}</Label>
        <span className="text-xs text-muted-foreground">{L("截止、考试、比赛等，提前一周提醒团队", "Deadlines, exams, competitions — the team is reminded a week ahead")}</span>
        <div className="ml-auto flex gap-1">
          {currentDoc?.content && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void extract()} disabled={extracting}>
              {extracting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <FileSearch className="mr-1 h-3.5 w-3.5" />}{L("从方案提取", "From plan")}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAdding(true)}><Plus className="mr-1 h-3.5 w-3.5" />{L("添加", "Add")}</Button>
        </div>
      </div>
      {isLoading ? null : dates.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">{L("这个季度还没有关键日期。", "No key dates this quarter.")}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {dates.map((d) => editId === d.id ? (
            <li key={d.id} className="flex flex-wrap items-center gap-2 bg-muted/30 px-3 py-2">
              <Input type="date" className="h-8 w-[9.5rem]" value={editDue} onChange={(e) => setEditDue(e.target.value)} aria-label={L("日期", "Date")} />
              <Input autoFocus className="h-8 min-w-[180px] flex-1" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveEdit(); } if (e.key === "Escape") setEditId(null); }} aria-label={L("名称", "Title")} />
              <Button size="sm" className="h-8" onClick={() => void saveEdit()} disabled={!editTitle.trim() || !editDue}>{L("保存", "Save")}</Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditId(null)}>{L("取消", "Cancel")}</Button>
            </li>
          ) : (
            <li key={d.id} className="group flex items-center gap-3 px-3 py-2 text-sm">
              <span className={cn("w-14 shrink-0 tabular-nums", d.due_date < today ? "text-muted-foreground line-through" : "font-medium text-pine")}>{d.due_date.slice(5).replace("-", "/")}</span>
              <span className={cn("min-w-0 flex-1", d.due_date < today && "text-muted-foreground")}>{d.title}</span>
              <button className="text-muted-foreground opacity-0 hover:text-foreground focus:opacity-100 group-hover:opacity-100" aria-label={L("修改", "Edit")}
                onClick={() => { setEditId(d.id); setEditTitle(d.title); setEditDue(d.due_date); }}>
                <Pencil className="h-4 w-4" />
              </button>
              <button className="text-muted-foreground opacity-0 hover:text-destructive focus:opacity-100 group-hover:opacity-100" aria-label={L("删除", "Delete")}
                onClick={async () => { if (window.confirm(L(`删除关键日期「${d.title}」？`, `Delete "${d.title}"?`))) { await removeKeyDate(d.id).catch(() => toast.error(L("删除失败", "Couldn't delete"))); refresh(); } }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {adding && (
            <li className="flex flex-wrap items-center gap-2 px-3 py-2">
              <Input type="date" className="h-8 w-[9.5rem]" value={due} min={from} max={to} onChange={(e) => setDue(e.target.value)} aria-label={L("日期", "Date")} />
              <Input autoFocus className="h-8 min-w-[180px] flex-1" value={title} placeholder={L("如：SHAD 申请截止", "e.g. SHAD application deadline")}
                onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void add(); } }} />
              <Button size="sm" className="h-8" onClick={() => void add()} disabled={!title.trim() || !due}>{L("保存", "Save")}</Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setAdding(false)}>{L("取消", "Cancel")}</Button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
