import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, ClipboardCopy, ClipboardPaste, History, Pencil, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";
import { type ActivityDraft, assist, parseActivities, type ParsedEntry, requestUpdate, useActivities, useActivityHistory, useActivityMutations } from "./data";
import {
  type Activity, byOrder, CATEGORIES, type Category, exportText, fromMonth, LEVELS, type Level,
  period, staleness, STATUSES, type Status, TIMINGS, type Timing, toMonth,
} from "./model";

const GRADES = ["9", "10", "11", "12", "PG"];
const NONE = "__none";

/** Counselor view of a student's activity portfolio. */
export default function ActivityPortfolio({ studentId }: { studentId: string }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { data: activities = [] } = useActivities(studentId);
  const m = useActivityMutations(studentId);
  const [edit, setEdit] = useState<Activity | "new" | null>(null);
  const [asking, setAsking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [parsed, setParsed] = useState<ParsedEntry[] | null>(null);
  const sorted = useMemo(() => [...activities].sort(byOrder), [activities]);
  const flagged = sorted.filter((a) => a.needs_review).length;

  const move = (i: number, d: -1 | 1) => {
    const ids = sorted.map((a) => a.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    m.reorder.mutate(ids);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(L("已复制", "Copied"));
    } catch {
      toast.error(L("复制失败，请手动选择文字复制", "Couldn't copy"));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-serif text-lg text-pine">
          {L("活动档案", "Activity portfolio")}
          <span className="ml-2 text-sm font-normal text-muted-foreground">{sorted.length}</span>
          {flagged > 0 && <Badge variant="outline" className="ml-2 border-brass text-brass">{L(`${flagged} 条待重新核对`, `${flagged} to re-check`)}</Badge>}
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => copy(exportText(sorted))} disabled={!sorted.length}><ClipboardCopy className="mr-1.5 h-4 w-4" />{L("复制全部（英文）", "Copy all")}</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}><History className="mr-1.5 h-4 w-4" />{L("修改记录", "History")}</Button>
          <Button variant="outline" size="sm" onClick={() => setAsking(true)}><Send className="mr-1.5 h-4 w-4" />{L("请学生更新", "Ask student to update")}</Button>
          <Button variant="outline" size="sm" onClick={() => setPasting(true)}><ClipboardPaste className="mr-1.5 h-4 w-4" />{L("粘贴文字，AI 整理", "Paste & organise")}</Button>
          <Button size="sm" onClick={() => setEdit("new")}><Plus className="mr-1.5 h-4 w-4" />{L("添加", "Add")}</Button>
        </div>
      </CardHeader>
      <CardContent>

            <p className="mb-2 text-xs text-muted-foreground">{L("用箭头调整顺序，重要的放前面。数量不限。", "Use the arrows to put the most important first. No limit.")}</p>
            {sorted.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">{L("学生还没有添加活动。可以点「请学生更新」发一条待办给学生。", "No entries yet. Use “Ask student to update” to send them a to-do.")}</p>
            ) : (
              <ol className="divide-y rounded-lg border">
                {sorted.map((a, i) => {
                  const stale = staleness(a);
                  return (
                    <li key={a.id} className="flex items-start gap-2 px-3 py-3">
                      <div className="flex flex-col">
                        <button type="button" aria-label={L("上移", "Move up")} disabled={i === 0} onClick={() => move(i, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                        <button type="button" aria-label={L("下移", "Move down")} disabled={i === sorted.length - 1} onClick={() => move(i, 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                      </div>
                      <span className="w-5 pt-0.5 text-right text-sm text-muted-foreground">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium">
                          {a.name}{a.name_en && a.name_en !== a.name && <span className="ml-2 font-normal text-muted-foreground">{a.name_en}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {CATEGORIES[a.category][lang]} · {STATUSES[a.status][lang]}{period(a, lang) && ` · ${period(a, lang)}`}
                          {a.hours_per_week != null && ` · ${a.hours_per_week}h/wk`}{a.weeks_per_year != null && ` · ${a.weeks_per_year}wk/yr`}
                          {a.level && ` · ${LEVELS[a.level][lang]}`}
                        </p>
                        {a.description && <p className="mt-1 whitespace-pre-line break-words text-sm text-foreground/80">{a.description}</p>}
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {a.needs_review ? <Badge variant="outline" className="border-brass text-brass"><AlertCircle className="mr-1 h-3 w-3" />{L("学生改过，待重新核对", "Changed by student")}</Badge>
                            : a.reviewed_at ? <Badge variant="outline" className="border-primary/40 text-primary"><CheckCircle2 className="mr-1 h-3 w-3" />{L("已核对", "Checked")}</Badge> : null}
                          {!a.description_en && a.status !== "planned" && <Badge variant="outline" className="text-muted-foreground">{L("缺英文描述", "No English yet")}</Badge>}
                          {stale === "old" && <Badge variant="outline" className="text-muted-foreground">{L("3 个月未更新", "Not updated in 3 months")}</Badge>}
                          {stale === "ended" && <Badge variant="outline" className="text-muted-foreground">{L("已过结束时间", "Past end date")}</Badge>}
                          {a.evidence_url && <a href={a.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">{L("证明材料", "Evidence")}</a>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" aria-label={a.reviewed_at && !a.needs_review ? L("取消核对", "Uncheck") : L("标记已核对", "Mark checked")}
                        onClick={() => m.review.mutate({ id: a.id, checked: !(a.reviewed_at && !a.needs_review) })}>
                        <CheckCircle2 className={`h-4 w-4 ${a.reviewed_at && !a.needs_review ? "text-primary" : "text-muted-foreground"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={L("修改", "Edit")} onClick={() => setEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    </li>
                  );
                })}
              </ol>
            )}
      </CardContent>

      {edit && (
        <EditDialog studentId={studentId} activity={edit === "new" ? null : edit} onClose={() => setEdit(null)}
          onSave={async (draft, id) => { await m.save.mutateAsync({ id, draft }); }}
          onDelete={async (id) => { await m.remove.mutateAsync(id); }} />
      )}
      {asking && <AskDialog studentId={studentId} onClose={() => setAsking(false)} />}
      {showHistory && <HistoryDialog studentId={studentId} onClose={() => setShowHistory(false)} />}
      {pasting && <PasteDialog studentId={studentId} onClose={() => setPasting(false)} onParsed={(list) => { setPasting(false); setParsed(list); }} />}
      {parsed && <ReviewParsed items={parsed} onClose={() => setParsed(null)}
        onAdd={async (list) => {
          await m.addMany.mutateAsync(list.map((e) => ({
            name: e.name, name_en: e.name_en || null, category: e.category as Category, status: e.status,
            start_date: e.start_date, end_date: e.end_date, hours_per_week: e.hours_per_week, weeks_per_year: e.weeks_per_year,
            role: e.role || null, organization: e.organization || null, level: (e.level || null) as Level | null,
            description: e.description || null, description_en: e.description_en || null,
          })));
          toast.success(L(`已加入 ${list.length} 条，可以继续修改细节`, `Added ${list.length}; edit details as needed`));
        }} />}
    </Card>
  );
}

type Full = {
  name: string; name_en: string; category: Category; status: Status; start: string; end: string; hours: string; weeks: string;
  timing: Timing | ""; role: string; organization: string; level: Level | ""; description: string; description_en: string;
  evidence_url: string; continue: "" | "yes" | "no"; grades: string[];
};
const toFull = (a: Activity | null): Full => ({
  name: a?.name ?? "", name_en: a?.name_en ?? "", category: a?.category ?? "activity", status: a?.status ?? "ongoing",
  start: toMonth(a?.start_date ?? null), end: toMonth(a?.end_date ?? null),
  hours: a?.hours_per_week == null ? "" : String(a.hours_per_week), weeks: a?.weeks_per_year == null ? "" : String(a.weeks_per_year),
  timing: a?.timing ?? "", role: a?.role ?? "", organization: a?.organization ?? "", level: a?.level ?? "",
  description: a?.description ?? "", description_en: a?.description_en ?? "", evidence_url: a?.evidence_url ?? "",
  continue: a?.continue_in_college == null ? "" : a.continue_in_college ? "yes" : "no", grades: a?.grade_levels ?? [],
});
const num = (s: string) => (s.trim() === "" ? null : Number(s));

function EditDialog({ studentId, activity, onClose, onSave, onDelete }: {
  studentId: string; activity: Activity | null; onClose: () => void;
  onSave: (d: ActivityDraft, id?: string) => Promise<void>; onDelete: (id: string) => Promise<void>;
}) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [f, setF] = useState<Full>(() => toFull(activity));
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const set = <K extends keyof Full>(k: K, v: Full[K]) => setF((x) => ({ ...x, [k]: v }));

  const draft = (): ActivityDraft => ({
    name: f.name.trim(), name_en: f.name_en.trim() || null, category: f.category, status: f.status,
    start_date: fromMonth(f.start), end_date: f.status === "ongoing" ? null : fromMonth(f.end),
    hours_per_week: num(f.hours), weeks_per_year: num(f.weeks), timing: f.timing || null, role: f.role.trim() || null,
    organization: f.organization.trim() || null, level: f.level || null, description: f.description.trim() || null,
    description_en: f.description_en.trim() || null, evidence_url: f.evidence_url.trim() || null,
    continue_in_college: f.continue === "" ? null : f.continue === "yes", grade_levels: f.grades,
  });

  const fill = async () => {
    setThinking(true);
    try {
      const s = await assist(studentId, draft());
      // only fill what's empty, so the counselor's own edits are kept
      setF((x) => ({
        ...x,
        name_en: x.name_en || s.name_en, role: x.role || s.position, organization: x.organization || s.organization,
        description_en: x.description_en || s.description_en,
      }));
      toast.success(L("AI 已填好空着的英文栏目，请检查后保存", "AI filled the empty English fields — check them, then save"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setThinking(false);
    }
  };

  const save = async () => {
    const n = [num(f.hours), num(f.weeks)];
    if (n.some((v) => v != null && Number.isNaN(v))) return toast.error(L("小时数和周数要填数字", "Hours and weeks must be numbers"));
    setBusy(true);
    try {
      await onSave(draft(), activity?.id);
      toast.success(L("已保存", "Saved"));
      onClose();
    } catch {
      toast.error(L("保存失败", "Couldn't save"));
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!activity || !window.confirm(L(`删除「${activity.name}」？`, `Delete “${activity.name}”?`))) return;
    try {
      await onDelete(activity.id);
      onClose();
    } catch {
      toast.error(L("删除失败", "Couldn't delete"));
    }
  };

  const field = (id: string, label: string, el: React.ReactNode, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {el}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  const sel = <T extends string>(id: string, value: T | "", opts: [T, string][], on: (v: T | "") => void) => (
    <Select value={value || NONE} onValueChange={(v) => on(v === NONE ? "" : (v as T))}>
      <SelectTrigger id={id}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>—</SelectItem>
        {opts.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{activity ? L("修改活动", "Edit entry") : L("添加活动", "Add entry")}</DialogTitle></DialogHeader>

        <section className="space-y-3">
          <h4 className="text-sm font-medium text-pine">{L("学生填写的部分", "What the student fills in")}</h4>
          {field("f-name", L("名称", "Name"), <Input id="f-name" value={f.name} onChange={(e) => set("name", e.target.value)} />)}
          <div className="grid gap-3 sm:grid-cols-2">
            {field("f-cat", L("类型", "Type"), sel("f-cat", f.category, (Object.keys(CATEGORIES) as Category[]).map((k) => [k, CATEGORIES[k][lang]]), (v) => set("category", (v || "activity") as Category)))}
            {field("f-status", L("状态", "Status"), sel("f-status", f.status, (Object.keys(STATUSES) as Status[]).map((k) => [k, STATUSES[k][lang]]), (v) => set("status", (v || "ongoing") as Status)))}
            {field("f-start", L("开始", "Start"), <Input id="f-start" type="month" value={f.start} onChange={(e) => set("start", e.target.value)} />)}
            {f.status !== "ongoing" && field("f-end", L("结束", "End"), <Input id="f-end" type="month" value={f.end} onChange={(e) => set("end", e.target.value)} />)}
            {field("f-hours", L("每周小时", "Hours / week"), <Input id="f-hours" inputMode="decimal" value={f.hours} onChange={(e) => set("hours", e.target.value)} />)}
          </div>
          {field("f-desc", L("学生描述（任何语言）", "Student's note (any language)"), <Textarea id="f-desc" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} />)}
          {field("f-link", L("证明材料链接", "Evidence link"), <Input id="f-link" type="url" value={f.evidence_url} onChange={(e) => set("evidence_url", e.target.value)} />)}
        </section>

        <section className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-pine">{L("顾问补充（英文）", "Counselor details (English)")}</h4>
            <Button type="button" variant="outline" size="sm" onClick={fill} disabled={thinking || !(f.name.trim() || f.description.trim())}>
              <Sparkles className="mr-1.5 h-4 w-4" />{thinking ? L("生成中…", "Working…") : L("AI 补全", "AI fill-in")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{L("AI 只填空着的栏目，不会改你已经写好的内容；只用学生给的信息，不会编造成绩或奖项。", "AI fills empty fields only and uses only the facts given.")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {field("f-en", L("英文名称", "English name"), <Input id="f-en" value={f.name_en} onChange={(e) => set("name_en", e.target.value)} />)}
            {field("f-role", L("职位/角色", "Position"), <Input id="f-role" value={f.role} onChange={(e) => set("role", e.target.value)} maxLength={100} />)}
            {field("f-org", L("组织名称", "Organization"), <Input id="f-org" value={f.organization} onChange={(e) => set("organization", e.target.value)} />)}
            {field("f-weeks", L("每年几周", "Weeks / year"), <Input id="f-weeks" inputMode="numeric" value={f.weeks} onChange={(e) => set("weeks", e.target.value)} />)}
            {field("f-timing", L("参与时间段", "Timing"), sel("f-timing", f.timing, (Object.keys(TIMINGS) as Timing[]).map((k) => [k, TIMINGS[k][lang]]), (v) => set("timing", v)))}
            {field("f-level", L("级别（奖项/竞赛）", "Level (awards)"), sel("f-level", f.level, (Object.keys(LEVELS) as Level[]).map((k) => [k, LEVELS[k][lang]]), (v) => set("level", v)))}
            {field("f-cont", L("大学是否继续", "Continue in college"), sel("f-cont", f.continue, [["yes", L("是", "Yes")], ["no", L("否", "No")]], (v) => set("continue", v)))}
          </div>
          <div className="space-y-1.5">
            <Label>{L("参与年级", "Grades")}</Label>
            <div className="flex flex-wrap gap-3">
              {GRADES.map((g) => (
                <label key={g} className="flex items-center gap-1.5 text-sm">
                  <Switch checked={f.grades.includes(g)} onCheckedChange={(on) => set("grades", on ? [...f.grades, g] : f.grades.filter((x) => x !== g))} />
                  {g}
                </label>
              ))}
            </div>
          </div>
          {field("f-den", L("英文描述", "English description"), <Textarea id="f-den" rows={3} value={f.description_en} onChange={(e) => set("description_en", e.target.value)} />)}
        </section>

        <DialogFooter className="gap-2 sm:justify-between">
          {activity ? <Button variant="ghost" className="text-destructive" onClick={del}><Trash2 className="mr-1.5 h-4 w-4" />{L("删除", "Delete")}</Button> : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>{L("取消", "Cancel")}</Button>
            <Button onClick={save} disabled={busy || !f.name.trim()}>{L("保存", "Save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AskDialog({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const inAWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const [due, setDue] = useState(inAWeek);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      const r = await requestUpdate(studentId, due, note);
      const team = r.followups?.length ? L(`；已通知跟进老师 ${r.followups.join("、")}`, `; follow-up teacher ${r.followups.join(", ")} notified`) : "";
      if (r.emailed) toast.success(L(`已发送：学生收到了邮件和待办${team}`, `Sent: the student got an email and a to-do${team}`));
      else toast.success(L(`已加到学生的待办里，但学生没有可用邮箱，没有发邮件${team}`, `Added to the student's to-dos; no email address, so no email${team}`));
      onClose();
    } catch {
      toast.error(L("发送失败", "Couldn't send"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{L("请学生更新活动档案", "Ask the student to update")}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{L("学生会收到一封邮件，待办里也会出现一条「更新活动档案」，点「去填写」就能填，完成后自动勾掉。学生的跟进老师也会收到邮件，协助提醒。", "The student gets an email and a to-do that opens the portfolio and ticks itself off when they're done.")}</p>
        <div className="space-y-1.5">
          <Label htmlFor="ask-due">{L("截止日期", "Due")}</Label>
          <Input id="ask-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ask-note">{L("补充说明（选填）", "Note (optional)")}</Label>
          <Input id="ask-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={100} placeholder={L("例：把暑假的科研项目加上", "e.g. add your summer research")} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{L("取消", "Cancel")}</Button>
          <Button onClick={send} disabled={busy}>{L("发送", "Send")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const FIELD_NAMES: Record<string, [string, string]> = {
  name: ["名称", "Name"], name_en: ["英文名称", "English name"], category: ["类型", "Type"], status: ["状态", "Status"],
  start_date: ["开始", "Start"], end_date: ["结束", "End"], hours_per_week: ["每周小时", "Hours/week"], weeks_per_year: ["每年周数", "Weeks/year"],
  timing: ["时间段", "Timing"], role: ["职位", "Position"], organization: ["组织", "Organization"], level: ["级别", "Level"],
  description: ["学生描述", "Student note"], description_en: ["英文描述", "English description"],
  evidence_url: ["证明链接", "Evidence"], continue_in_college: ["大学继续", "Continue"], grade_levels: ["年级", "Grades"],
};

function HistoryDialog({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { data: rows = [], isLoading } = useActivityHistory(studentId, true);
  const changed = (b: Record<string, unknown>, a: Record<string, unknown>) =>
    Object.keys(FIELD_NAMES).filter((k) => JSON.stringify(b?.[k] ?? null) !== JSON.stringify(a?.[k] ?? null));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{L("修改记录", "Change history")}</DialogTitle></DialogHeader>
        {isLoading ? null : rows.length === 0 ? <p className="text-sm text-muted-foreground">{L("还没有记录", "Nothing yet")}</p> : (
          <ul className="divide-y text-sm">
            {rows.map((r) => {
              const name = (r.after?.name || r.before?.name) as string;
              const by = r.changed_by && r.changed_by === studentId ? L("学生", "Student") : L("顾问", "Counselor");
              const fields = r.action === "changed" ? changed(r.before as Record<string, unknown>, r.after as Record<string, unknown>) : [];
              return (
                <li key={r.id} className="py-2">
                  <p><span className="text-muted-foreground">{new Date(r.changed_at).toLocaleString(lang === "zh" ? "zh-CN" : "en-CA", { dateStyle: "medium", timeStyle: "short" })} · {by}</span></p>
                  <p>
                    {r.action === "added" ? L("添加了", "Added") : r.action === "deleted" ? L("删除了", "Deleted") : L("修改了", "Changed")} 「{name}」
                    {fields.length > 0 && <span className="text-muted-foreground">：{fields.map((k) => FIELD_NAMES[k][lang === "zh" ? 0 : 1]).join("、")}</span>}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PasteDialog({ studentId, onClose, onParsed }: { studentId: string; onClose: () => void; onParsed: (list: ParsedEntry[]) => void }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const list = await parseActivities(studentId, text);
      if (!list.length) toast.info(L("没有从这段文字里找到活动", "No entries found in the text"));
      else onParsed(list);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{L("粘贴活动信息", "Paste activities")}</DialogTitle></DialogHeader>
        <Label htmlFor="act-paste" className="text-sm font-normal text-muted-foreground">
          {L("从简历、聊天记录或笔记里直接复制过来，中英文、格式都不限。AI 会拆成一条条活动，你确认后再加入。", "Copy from a résumé, chat or notes, any language or format. AI splits it into entries for you to confirm.")}
        </Label>
        <Textarea id="act-paste" rows={12} value={text} onChange={(e) => setText(e.target.value)} maxLength={20000}
          placeholder={L("例：\n2024.9 至今 学校机器人社社长，每周 6 小时，带队拿了省赛第三\n2025 暑假 UBC 化学实验室研究助理 6 周\nAMC 12 2025 Distinction", "e.g. Robotics club captain since Sep 2024, 6 h/week, 3rd at provincials")} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>{L("取消", "Cancel")}</Button>
          <Button onClick={() => void go()} disabled={busy || !text.trim()}>
            <Sparkles className="mr-1.5 h-4 w-4" />{busy ? L("AI 整理中…", "Working…") : L("AI 整理", "Organise")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewParsed({ items, onClose, onAdd }: { items: ParsedEntry[]; onClose: () => void; onAdd: (list: ParsedEntry[]) => Promise<void> }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [rows, setRows] = useState(() => items.map((e) => ({ ...e, on: true })));
  const [busy, setBusy] = useState(false);
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  // a cleared name becomes 未命名活动 rather than dropping the entry
  const chosen = rows.filter((r) => r.on).map((r) => ({ ...r, name: r.name.trim() || (lang === "zh" ? "未命名活动" : "Untitled activity") }));
  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{L(`AI 整理出 ${items.length} 条`, `${items.length} entries found`)}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{L("可以直接改名称和类型，取消不需要的。加入后，其他细节在列表里点「修改」补充，学生也能修改。", "Fix names and types here, untick what you don't want. Edit other details from the list afterwards.")}</p>
        <ul className="space-y-2">
          {rows.map((e, i) => (
            <li key={i} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Checkbox checked={e.on} onCheckedChange={(v) => set(i, { on: !!v })} aria-label={L("加入", "Include")} />
                <Input value={e.name} onChange={(x) => set(i, { name: x.target.value })} className="h-8 min-w-[200px] flex-1" aria-label={L("名称", "Name")} />
                <Select value={e.category} onValueChange={(v) => set(i, { category: v })}>
                  <SelectTrigger className="h-8 w-[8.5rem]" aria-label={L("类型", "Type")}><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(CATEGORIES) as Category[]).map((k) => <SelectItem key={k} value={k}>{CATEGORIES[k][lang]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <p className="mt-1.5 pl-6 text-xs text-muted-foreground">
                {[STATUSES[e.status][lang], period(e, lang), e.role, e.organization, e.hours_per_week != null ? L(`每周 ${e.hours_per_week} 小时`, `${e.hours_per_week} h/wk`) : ""].filter(Boolean).join(" · ")}
              </p>
              {(e.description || e.description_en) && <p className="mt-1 pl-6 text-sm text-foreground/80">{lang === "zh" ? e.description || e.description_en : e.description_en || e.description}</p>}
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>{L("取消", "Cancel")}</Button>
          <Button disabled={busy || !chosen.length} onClick={async () => { setBusy(true); try { await onAdd(chosen.map(({ on: _on, ...e }) => e)); onClose(); } catch { toast.error(L("加入失败", "Couldn't add")); } finally { setBusy(false); } }}>
            {L(`加入 ${chosen.length} 条`, `Add ${chosen.length}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
