import { useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, ChevronDown, ClipboardPaste, FileUp, ListChecks, NotebookText, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  addTodos, CATEGORY_LABEL, type Category, daysUntil, type Draft, extractFromFile, extractFromText, extractSchools, ROUNDS, UPLOAD_ACCEPT, type School, type Status, STATUS_LABEL,
  type Suggested, type SuggestedTodo, suggestTodos, SYSTEM_LABEL, type SystemCode, useSchoolList, useSchoolMutations,
} from "./data";

const NONE = "__none";
const fmt = (d: string | null, lang: "zh" | "en") =>
  d ? (lang === "zh" ? `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日` : new Date(`${d}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" })) : "—";

/** Counselor's school list for one student: AI draft from the student's materials, then AI to-dos. */
export default function SchoolList({ studentId }: { studentId: string }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { data: list = [], isLoading } = useSchoolList(studentId);
  const m = useSchoolMutations(studentId);
  const [edit, setEdit] = useState<School | "new" | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [suggested, setSuggested] = useState<Suggested[] | null>(null);
  const [planning, setPlanning] = useState(false);
  const [todos, setTodos] = useState<SuggestedTodo[] | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const [pasting, setPasting] = useState(false);
  const extract = async (from: { file?: File; text?: string } = {}) => {
    setExtracting(true);
    try {
      const r = from.file ? await extractFromFile(studentId, from.file) : from.text ? await extractFromText(studentId, from.text) : await extractSchools(studentId);
      if (r.empty) return toast.info(from.file || from.text ? L("没有读到内容。", "Nothing to read.") : L("这位学生还没有规划文档、规划报告或会议纪要，没有可以读的资料。", "No planning documents, reports or meeting notes to read yet."));
      if (!r.schools.length) return toast.info(from.file || from.text ? L("没有在里面找到学校。", "No schools found.") : L(`读了 ${r.sources.meetings ?? 0} 次会议、${r.sources.reports ?? 0} 份报告、${r.sources.documents ?? 0} 份文档，没有找到明确的目标学校。`, "No target schools found in the materials."));
      setSuggested(r.schools);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExtracting(false);
    }
  };
  const plan = async () => {
    setPlanning(true);
    try {
      const r = await suggestTodos(studentId);
      if (r.empty || !r.todos.length) return toast.info(L("没有需要安排的学校（都已提交，或还没有学校）。", "Nothing left to plan."));
      setTodos(r.todos);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPlanning(false);
    }
  };

  const unchecked = list.filter((s) => s.deadline && !s.deadline_checked).length;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-serif text-lg text-pine">
          {L("选校单", "School list")}<span className="ml-2 text-sm font-normal text-muted-foreground">{list.length}</span>
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={extracting}>
                <Sparkles className="mr-1.5 h-4 w-4" />{extracting ? L("AI 正在读…", "Reading…") : L("AI 生成选校单", "AI draft")}<ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onSelect={() => void extract()}><NotebookText className="mr-2 h-4 w-4" />{L("从规划资料和会议纪要", "From planning notes")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => fileInput.current?.click()}><FileUp className="mr-2 h-4 w-4" />{L("上传选校单文件（Excel / Word / PDF）", "Upload a school list file")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setPasting(true)}><ClipboardPaste className="mr-2 h-4 w-4" />{L("粘贴选校单文字", "Paste a school list")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input ref={fileInput} type="file" accept={UPLOAD_ACCEPT} className="hidden" aria-hidden="true" tabIndex={-1}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void extract({ file: f }); }} />
          <Button variant="outline" size="sm" onClick={plan} disabled={planning || !list.length}>
            <ListChecks className="mr-1.5 h-4 w-4" />{planning ? L("生成中…", "Working…") : L("生成待办", "Draft to-dos")}
          </Button>
          <Button size="sm" onClick={() => setEdit("new")}><Plus className="mr-1.5 h-4 w-4" />{L("添加学校", "Add school")}</Button>
        </div>
      </CardHeader>
      <CardContent>
        {unchecked > 0 && (
          <p className="mb-3 rounded-md border border-brass/40 bg-brass/10 px-3 py-2 text-sm">
            {L(`有 ${unchecked} 个截止日期是 AI 估计的，请核对后点日期旁的勾确认。`, `${unchecked} deadlines are AI estimates — check and confirm them.`)}
          </p>
        )}
        {isLoading ? null : list.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">{L("还没有学校。点「AI 生成选校单」：可以让 AI 从这位学生的规划资料和会议纪要里整理，也可以上传或粘贴你已经做好的选校单。你确认后才会加入。", "No schools yet. Use “AI draft” to build the list from planning notes, or from a list you upload or paste. You confirm before anything is added.")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">{L("学校 / 专业", "School / programme")}</th>
                  <th className="px-3 py-2 font-medium">{L("轮次 · 系统", "Round · system")}</th>
                  <th className="px-3 py-2 font-medium">{L("截止", "Deadline")}</th>
                  <th className="px-3 py-2 font-medium">{L("定位", "Fit")}</th>
                  <th className="px-3 py-2 font-medium">{L("状态", "Status")}</th>
                  <th className="px-3 py-2"><span className="sr-only">{L("操作", "Actions")}</span></th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const days = daysUntil(s.deadline);
                  const open = s.status === "preparing" || s.status === "considering";
                  return (
                    <tr key={s.id} className="border-t align-top">
                      <td className="px-3 py-2.5"><div className="font-medium">{s.college_name}</div><div className="text-muted-foreground">{s.major || "—"}</div></td>
                      <td className="px-3 py-2.5">{s.round || "—"}<div className="text-muted-foreground">{s.application_system ? SYSTEM_LABEL[s.application_system] : "—"}</div></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {fmt(s.deadline, lang)}
                          {s.deadline && !s.deadline_checked && (
                            <button type="button" title={L("AI 估计，核对后点这里确认", "AI estimate — click to confirm")} aria-label={L("确认截止日期", "Confirm deadline")}
                              onClick={() => m.save.mutate({ id: s.id, draft: { deadline_checked: true } })} className="text-brass hover:text-pine">
                              <CalendarCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {open && days != null && <div className={days < 0 ? "text-destructive" : days <= 21 ? "font-medium text-[#9A3B12]" : "text-muted-foreground"}>{days < 0 ? L("已过", "passed") : L(`还有 ${days} 天`, `${days} days`)}</div>}
                        {s.deadline && !s.deadline_checked && <Badge variant="outline" className="mt-1 border-brass text-[11px] text-brass">{L("待核对", "to check")}</Badge>}
                      </td>
                      <td className="px-3 py-2.5">{s.category && s.category in CATEGORY_LABEL ? CATEGORY_LABEL[s.category as Exclude<Category, "">][lang] : "—"}</td>
                      <td className="px-3 py-2.5">
                        <Select value={s.status} onValueChange={(v) => m.save.mutate({ id: s.id, draft: { status: v as Status } })}>
                          <SelectTrigger className="h-8 w-[7.5rem]" aria-label={L("状态", "Status")}><SelectValue /></SelectTrigger>
                          <SelectContent>{(Object.keys(STATUS_LABEL) as Status[]).map((k) => <SelectItem key={k} value={k}>{STATUS_LABEL[k][lang]}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button variant="ghost" size="icon" aria-label={L("修改", "Edit")} onClick={() => setEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{L("选校单涉及的申请系统会自动加到这位学生的「申请信息」里。", "Application systems on this list are added to the student's application info automatically.")}</p>
      </CardContent>

      {edit && <EditDialog school={edit === "new" ? null : edit} lang={lang} onClose={() => setEdit(null)}
        onSave={(draft, id) => m.save.mutateAsync({ id, draft })} onDelete={(id) => m.remove.mutateAsync(id)} />}
      {suggested && <ReviewSchools items={suggested} existing={list} lang={lang} onClose={() => setSuggested(null)}
        onAdd={async (rows) => {
          await m.addMany.mutateAsync(rows.map((s) => ({
            college_name: s.college_name, major: s.major || null, round: s.round || null, application_system: s.application_system,
            country: s.country || null, category: s.category || null, deadline: s.deadline, deadline_checked: s.deadline_from_notes,
            status: "preparing", source: "ai", notes: s.evidence ? `AI 来源：${s.evidence}` : null,
          })));
          toast.success(L(`已加入 ${rows.length} 所学校`, `Added ${rows.length} schools`));
        }} />}
      {pasting && <PasteDialog lang={lang} onClose={() => setPasting(false)} onSubmit={(text) => { setPasting(false); void extract({ text }); }} />}
      {todos && <ReviewTodos items={todos} lang={lang} onClose={() => setTodos(null)}
        onAdd={async (items) => {
          const r = await addTodos(studentId, items);
          toast.success(L(`已加入：学生待办 ${r.student} 条，顾问待办 ${r.counselor} 条`, `Added ${r.student} student and ${r.counselor} counselor to-dos`));
        }} />}
    </Card>
  );
}

function EditDialog({ school, lang, onClose, onSave, onDelete }: {
  school: School | null; lang: "zh" | "en"; onClose: () => void;
  onSave: (d: Partial<Draft>, id?: string) => Promise<unknown>; onDelete: (id: string) => Promise<unknown>;
}) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [f, setF] = useState({
    college_name: school?.college_name ?? "", major: school?.major ?? "", round: school?.round ?? "",
    application_system: (school?.application_system ?? "") as SystemCode | "", deadline: school?.deadline ?? "",
    category: (school?.category ?? "") as Category, notes: school?.notes ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true);
    try {
      await onSave({
        college_name: f.college_name.trim(), major: f.major.trim() || null, round: f.round || null,
        application_system: (f.application_system || null) as SystemCode | null, deadline: f.deadline || null,
        // saving here counts as checking the date
        deadline_checked: !!f.deadline, category: f.category || null, notes: f.notes.trim() || null,
        ...(school ? {} : { status: "preparing" as Status, source: "manual" }),
      }, school?.id);
      onClose();
    } catch {
      toast.error(L("保存失败", "Couldn't save"));
    } finally {
      setBusy(false);
    }
  };
  const sel = (id: string, value: string, opts: [string, string][], on: (v: string) => void) => (
    <Select value={value || NONE} onValueChange={(v) => on(v === NONE ? "" : v)}>
      <SelectTrigger id={id}><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value={NONE}>—</SelectItem>{opts.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{school ? L("修改学校", "Edit school") : L("添加学校", "Add school")}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="s-name">{L("学校（英文全称）", "School")}</Label><Input id="s-name" value={f.college_name} onChange={(e) => set("college_name", e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="s-major">{L("专业 / 项目", "Programme")}</Label><Input id="s-major" value={f.major} onChange={(e) => set("major", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="s-round">{L("轮次", "Round")}</Label>{sel("s-round", f.round, ROUNDS.map((r) => [r, r]), (v) => set("round", v))}</div>
          <div className="space-y-1.5"><Label htmlFor="s-sys">{L("申请系统", "System")}</Label>{sel("s-sys", f.application_system, (Object.keys(SYSTEM_LABEL) as SystemCode[]).map((k) => [k, SYSTEM_LABEL[k]]), (v) => set("application_system", v as SystemCode))}</div>
          <div className="space-y-1.5"><Label htmlFor="s-dl">{L("截止日期", "Deadline")}</Label><Input id="s-dl" type="date" value={f.deadline} onChange={(e) => set("deadline", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="s-cat">{L("定位", "Fit")}</Label>{sel("s-cat", f.category, (Object.keys(CATEGORY_LABEL) as Exclude<Category, "">[]).map((k) => [k, CATEGORY_LABEL[k][lang]]), (v) => set("category", v as Category))}</div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="s-notes">{L("备注", "Notes")}</Label><Input id="s-notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {school ? <Button variant="ghost" className="text-destructive" onClick={async () => { if (window.confirm(L(`从选校单删除「${school.college_name}」？`, `Remove ${school.college_name}?`))) { await onDelete(school.id); onClose(); } }}><Trash2 className="mr-1.5 h-4 w-4" />{L("删除", "Delete")}</Button> : <span />}
          <div className="flex gap-2"><Button variant="outline" onClick={onClose}>{L("取消", "Cancel")}</Button><Button onClick={save} disabled={busy || !f.college_name.trim()}>{L("保存", "Save")}</Button></div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewSchools({ items, existing, lang, onClose, onAdd }: {
  items: Suggested[]; existing: School[]; lang: "zh" | "en"; onClose: () => void; onAdd: (rows: Suggested[]) => Promise<void>;
}) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const already = (s: Suggested) => existing.some((e) => e.college_name.toLowerCase() === s.college_name.toLowerCase() && (e.major ?? "").toLowerCase() === s.major.toLowerCase());
  const [picked, setPicked] = useState(() => new Set(items.map((s, i) => (already(s) ? -1 : i)).filter((i) => i >= 0)));
  const [busy, setBusy] = useState(false);
  const toggle = (i: number, on: boolean) => setPicked((p) => { const n = new Set(p); if (on) n.add(i); else n.delete(i); return n; });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{L("AI 从资料里找到的学校", "Schools found in the notes")}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{L("勾选要加入选校单的学校。截止日期如果不是资料里写的，会标为「待核对」。", "Tick the ones to add. Deadlines not taken from the notes are marked to check.")}</p>
        <ul className="divide-y rounded-lg border">
          {items.map((s, i) => (
            <li key={i} className="flex gap-3 px-3 py-2.5">
              <Checkbox id={`sg-${i}`} checked={picked.has(i)} onCheckedChange={(on) => toggle(i, !!on)} className="mt-1" />
              <label htmlFor={`sg-${i}`} className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{s.college_name}</span>{s.major && <span className="text-muted-foreground"> · {s.major}</span>}
                <span className="block text-muted-foreground">
                  {[s.round, SYSTEM_LABEL[s.application_system], s.category && s.category in CATEGORY_LABEL ? CATEGORY_LABEL[s.category as Exclude<Category, "">][lang] : ""].filter(Boolean).join(" · ")}
                  {s.deadline && ` · ${L("截止", "due")} ${fmt(s.deadline, lang)}${s.deadline_from_notes ? "" : L("（AI 估计）", " (estimate)")}`}
                </span>
                {s.evidence && <span className="mt-0.5 block text-xs italic text-muted-foreground">“{s.evidence}”</span>}
                {already(s) && <span className="block text-xs text-brass">{L("选校单里已有", "Already on the list")}</span>}
              </label>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{L("取消", "Cancel")}</Button>
          <Button disabled={busy || picked.size === 0} onClick={async () => { setBusy(true); try { await onAdd(items.filter((_, i) => picked.has(i))); onClose(); } catch { toast.error(L("加入失败", "Couldn't add")); } finally { setBusy(false); } }}>
            {L(`加入 ${picked.size} 所`, `Add ${picked.size}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewTodos({ items, lang, onClose, onAdd }: { items: SuggestedTodo[]; lang: "zh" | "en"; onClose: () => void; onAdd: (t: SuggestedTodo[]) => Promise<void> }) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [rows, setRows] = useState(() => items.map((t) => ({ ...t, on: true })));
  const [busy, setBusy] = useState(false);
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const chosen = rows.filter((r) => r.on && r.title.trim());
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{L("AI 按截止日期生成的待办", "Suggested to-dos")}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{L("可以改标题和日期，取消不需要的。学生的会进入学生待办和提醒邮件，顾问的会进入顾问待办。", "Edit or untick as needed. Student items go to their to-dos; counselor items to yours.")}</p>
        <ul className="space-y-2">
          {rows.map((t, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
              <Checkbox checked={t.on} onCheckedChange={(on) => set(i, { on: !!on })} aria-label={L("加入", "Include")} />
              <Badge variant="outline" className={t.owner === "counselor" ? "border-brass text-brass" : "border-primary/40 text-primary"}>{t.owner === "counselor" ? L("顾问", "Counselor") : L("学生", "Student")}</Badge>
              <Input value={t.title} onChange={(e) => set(i, { title: e.target.value })} className="h-8 min-w-[220px] flex-1" aria-label={L("标题", "Title")} maxLength={300} />
              <Input type="date" value={t.due_date ?? ""} onChange={(e) => set(i, { due_date: e.target.value || null })} className="h-8 w-[9.5rem]" aria-label={L("日期", "Due")} />
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{L("取消", "Cancel")}</Button>
          <Button disabled={busy || !chosen.length} onClick={async () => { setBusy(true); try { await onAdd(chosen.map(({ on: _on, ...t }) => t)); onClose(); } catch { toast.error(L("加入失败", "Couldn't add")); } finally { setBusy(false); } }}>
            {L(`加入 ${chosen.length} 条待办`, `Add ${chosen.length}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasteDialog({ lang, onClose, onSubmit }: { lang: "zh" | "en"; onClose: () => void; onSubmit: (text: string) => void }) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [text, setText] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{L("粘贴选校单", "Paste a school list")}</DialogTitle></DialogHeader>
        <Label htmlFor="paste-list" className="text-sm font-normal text-muted-foreground">{L("从表格、文档或聊天里复制过来就行，格式不限。", "Copy from a sheet, document or chat; any format.")}</Label>
        <Textarea id="paste-list" rows={10} value={text} onChange={(e) => setText(e.target.value)} maxLength={20000}
          placeholder={L("例：\n1. UCLA — Economics — RD\n2. University of Toronto — Rotman Commerce\n3. LSE — BSc Economics", "e.g.\n1. UCLA — Economics — RD")} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{L("取消", "Cancel")}</Button>
          <Button disabled={!text.trim()} onClick={() => onSubmit(text)}>{L("让 AI 整理", "Read it")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
