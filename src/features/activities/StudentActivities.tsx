import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";
import { type ActivityDraft, useActivities, useActivityMutations } from "./data";
import { type Activity, CATEGORIES, type Category, fromMonth, period, STATUSES, type Status, toMonth, byOrder } from "./model";

type Form = { name: string; category: Category; status: Status; start: string; end: string; hours: string; note: string; link: string };
const empty: Form = { name: "", category: "activity", status: "ongoing", start: "", end: "", hours: "", note: "", link: "" };
const fromActivity = (a: Activity): Form => ({
  name: a.name, category: a.category, status: a.status, start: toMonth(a.start_date), end: toMonth(a.end_date),
  hours: a.hours_per_week == null ? "" : String(a.hours_per_week), note: a.description ?? "", link: a.evidence_url ?? "",
});

/**
 * The student's side of the activity portfolio: a list and a short form
 * (what, type, when, hours a week, a note). Counselors fill in the rest.
 */
export default function StudentActivities({ studentId, onFinished }: { studentId: string; onFinished?: () => void }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { data: activities = [], isLoading } = useActivities(studentId);
  const { save, remove } = useActivityMutations(studentId);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty);

  const open = (a?: Activity) => {
    setForm(a ? fromActivity(a) : empty);
    setEditing(a ? a.id : "new");
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = form.hours.trim() === "" ? null : Number(form.hours);
    if (hours != null && (Number.isNaN(hours) || hours < 0 || hours > 168)) return toast.error(L("每周小时数填 0–168 之间的数字", "Hours per week should be 0–168"));
    const draft: ActivityDraft = {
      name: form.name.trim(), category: form.category, status: form.status,
      start_date: fromMonth(form.start), end_date: form.status === "ongoing" ? null : fromMonth(form.end),
      hours_per_week: hours, description: form.note.trim() || null, evidence_url: form.link.trim() || null,
    };
    try {
      await save.mutateAsync({ id: editing && editing !== "new" ? editing : undefined, draft });
      toast.success(L("已保存", "Saved"));
      setEditing(null);
    } catch {
      toast.error(L("保存失败，请再试一次", "Couldn't save, please try again"));
    }
  };

  const del = async (a: Activity) => {
    if (!window.confirm(L(`删除「${a.name}」？`, `Delete “${a.name}”?`))) return;
    try {
      await remove.mutateAsync(a.id);
    } catch {
      toast.error(L("删除失败", "Couldn't delete"));
    }
  };

  const sorted = [...activities].sort(byOrder);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {L("把你参加过的活动、比赛、奖项、科研、实习、志愿服务和夏校都记在这里，计划要做的也可以先加上。每条只需要填几项，大约 1 分钟，顾问会帮你补全英文和申请用的版本。",
          "Keep your activities, competitions, awards, research, work, volunteering and summer programmes here, including ones you plan to do. Each takes about a minute; your counselor fills in the English and application versions.")}
      </p>

      {editing ? (
        <form onSubmit={submit} className="space-y-4 rounded-lg border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="act-name">{L("做了什么", "What is it")} *</Label>
            <Input id="act-name" required value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={200}
              placeholder={L("例：学校机器人社、AMC 12、社区图书馆志愿者", "e.g. School robotics club, AMC 12, library volunteer")} />
          </div>
          <div className="space-y-1.5">
            <Label>{L("类型", "Type")} *</Label>
            <div className="flex flex-wrap gap-1.5" role="radiogroup">
              {(Object.keys(CATEGORIES) as Category[]).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={form.category === c} onClick={() => set("category", c)}
                  className={`rounded-full border px-3 py-1 text-sm ${form.category === c ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {CATEGORIES[c][lang]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{L("状态", "Status")} *</Label>
            <div className="flex flex-wrap gap-1.5" role="radiogroup">
              {(Object.keys(STATUSES) as Status[]).map((s) => (
                <button key={s} type="button" role="radio" aria-checked={form.status === s} onClick={() => set("status", s)}
                  className={`rounded-full border px-3 py-1 text-sm ${form.status === s ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {STATUSES[s][lang]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="act-start">{form.status === "planned" ? L("计划开始", "Planned start") : L("开始时间", "Started")}</Label>
              <Input id="act-start" type="month" value={form.start} onChange={(e) => set("start", e.target.value)} />
            </div>
            {form.status !== "ongoing" && (
              <div className="space-y-1.5">
                <Label htmlFor="act-end">{form.status === "planned" ? L("计划结束", "Planned end") : L("结束时间", "Ended")}</Label>
                <Input id="act-end" type="month" value={form.end} min={form.start || undefined} onChange={(e) => set("end", e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="act-hours">{L("每周大约几小时", "Hours a week")}</Label>
              <Input id="act-hours" inputMode="decimal" value={form.hours} onChange={(e) => set("hours", e.target.value)} placeholder={L("例：3", "e.g. 3")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-note">{L("一两句话：你做了什么、有什么结果（选填，中文也可以）", "A sentence or two: what you did and any results (optional)")}</Label>
            <Textarea id="act-note" rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} maxLength={2000}
              placeholder={L("例：担任编程组组长，带 6 个人做比赛机器人，省赛第 3 名", "e.g. Led a team of 6 building the competition robot; 3rd at provincials")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-link">{L("证书或照片链接（选填）", "Link to a certificate or photo (optional)")}</Label>
            <Input id="act-link" type="url" value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={!form.name.trim() || save.isPending}>{L("保存", "Save")}</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>{L("取消", "Cancel")}</Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => open()}><Plus className="mr-1.5 h-4 w-4" />{L("添加一条", "Add one")}</Button>
      )}

      {isLoading ? null : sorted.length === 0 ? (
        !editing && <p className="py-4 text-sm text-muted-foreground">{L("还没有记录。", "Nothing here yet.")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {sorted.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORIES[a.category][lang]} · {STATUSES[a.status][lang]}
                  {period(a, lang) && ` · ${period(a, lang)}`}
                  {a.hours_per_week != null && ` · ${L(`每周 ${a.hours_per_week} 小时`, `${a.hours_per_week} h/wk`)}`}
                </p>
                {a.description && <p className="mt-1 whitespace-pre-line break-words text-sm text-foreground/80">{a.description}</p>}
              </div>
              <Button variant="ghost" size="icon" aria-label={L("修改", "Edit")} onClick={() => open(a)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" aria-label={L("删除", "Delete")} onClick={() => del(a)}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}

      {onFinished && sorted.length > 0 && !editing && (
        <div className="flex items-center gap-3 rounded-md border border-brass/40 bg-brass/10 px-4 py-3">
          <p className="flex-1 text-sm">{L("顾问请你更新活动档案。都加好了就点这里，待办会自动勾掉。", "Your counselor asked you to update this. When you're done, tick it off here.")}</p>
          <Button size="sm" onClick={onFinished}>{L("我更新完了", "I'm done")}</Button>
        </div>
      )}
    </div>
  );
}
