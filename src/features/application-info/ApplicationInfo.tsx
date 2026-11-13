import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, ClipboardCopy, Download, Lock, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";
import StudentActivities from "../activities/StudentActivities";
import { useActivities } from "../activities/data";
import { byOrder, CATEGORIES, period } from "../activities/model";
import { type AppProfile, useApplicationMutations, useApplicationOpen, useApplicationProfile } from "./data";
import { buildExport, exportAsText } from "./exportData";
import {
  type Address, type Answers, type Applicant, APPLICANTS, countsToward, type Field, isFilled, type Kind, problem, progress,
  type Section, type Sub, type System, SYSTEMS, visibleSections,
} from "./fields";

const LATIN_ONLY = new Set(["legal_first", "legal_middle", "legal_last", "preferred_name", "former_names"]);
const hasChinese = (s: string) => /[㐀-鿿]/.test(s);
const NONE = "__none";

/**
 * Application information: students fill it in once; counselors check each
 * section and export what each application system needs.
 */
export default function ApplicationInfo({ studentId, mode }: { studentId: string; mode: "student" | "counselor" }) {
  const { lang } = useLanguage();
  const L = useCallback((zh: string, en: string) => (lang === "zh" ? zh : en), [lang]);
  const { data: profile, isLoading, isError } = useApplicationProfile(studentId);
  const { data: activities = [] } = useActivities(studentId);
  const m = useApplicationMutations(studentId);
  const [active, setActive] = useState<string>("personal");

  const sections = useMemo(() => (profile ? visibleSections(profile.systems, profile.applicant_type, profile.data) : []), [profile]);
  const { data: open } = useApplicationOpen(mode === "counselor" ? studentId : null);
  const prog = useMemo(() => progress(sections, profile?.data ?? {}), [sections, profile?.data]);
  const current = sections.find((s) => s.key === active) ?? sections[0];

  if (isLoading) return <p className="py-8 text-sm text-muted-foreground">{L("加载中…", "Loading…")}</p>;
  if (isError || !profile) return <p className="py-8 text-sm text-destructive">{L("没能打开申请信息，请刷新页面再试", "Couldn't load. Please refresh.")}</p>;

  const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
  const flagged = Object.values(profile.reviews ?? {}).filter((r) => r?.needs_review).length;

  return (
    <div className="space-y-6">
      {mode === "counselor" ? (
        <Setup profile={profile} lang={lang} open={open} onChange={(patch) => m.saveSettings.mutate(patch, { onError: () => toast.error(L("没能保存", "Couldn't save")) })} />
      ) : (
        <p className="rounded-md bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {profile.systems.length
            ? L(`下面只列出你需要填的内容（${APPLICANTS[profile.applicant_type].zh}；${SYSTEMS.filter((s) => profile.systems.includes(s.key)).map((s) => s.zh).join("、")}）。`,
                `Only what you need to fill in is shown (${APPLICANTS[profile.applicant_type].en}; ${SYSTEMS.filter((s) => profile.systems.includes(s.key)).map((s) => s.en).join(", ")}).`)
            : L("下面是所有申请都需要的基础信息。顾问确定你要申请的系统后，这里会自动加上对应的内容。",
                "These are the basics every application needs. Once your counselor sets your application systems, anything extra appears here.")}
        </p>
      )}

      {(
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[200px] flex-1">
              <div className="mb-1 flex justify-between text-sm">
                <span>{L("完成度", "Progress")}</span>
                <span className="text-muted-foreground">{prog.done}/{prog.total} · {pct}%</span>
              </div>
              <Progress value={pct} />
            </div>
            {mode === "counselor" && flagged > 0 && <Badge variant="outline" className="border-brass text-brass">{L(`${flagged} 个板块学生改过，待重新核对`, `${flagged} sections changed by student`)}</Badge>}
            {mode === "counselor" && <ExportMenu profile={profile} activities={activities} lang={lang} />}
          </div>

          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <nav aria-label={L("板块", "Sections")} className="md:sticky md:top-24 md:self-start">
              <div className="md:hidden">
                <Select value={current?.key} onValueChange={setActive}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => <SelectItem key={s.key} value={s.key}>{s[lang]} {prog.per[s.key]?.total ? `(${prog.per[s.key].done}/${prog.per[s.key].total})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <ul className="hidden space-y-0.5 md:block">
                {sections.map((s) => {
                  const p = prog.per[s.key];
                  const r = profile.reviews?.[s.key];
                  const done = p && p.total > 0 && p.done === p.total;
                  return (
                    <li key={s.key}>
                      <button type="button" onClick={() => setActive(s.key)}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${current?.key === s.key ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"}`}>
                        <span className="flex-1">{s[lang]}</span>
                        {r?.needs_review ? <AlertCircle className="h-3.5 w-3.5 text-brass" aria-label={L("待重新核对", "Re-check")} />
                          : r?.at ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-label={L("已核对", "Checked")} /> : null}
                        {p && p.total > 0 && <span className={`text-xs ${done ? "text-primary" : "text-muted-foreground"}`}>{p.done}/{p.total}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {current && (
              <SectionForm key={current.key} section={current} profile={profile} mode={mode} lang={lang} studentId={studentId}
                activities={activities}
                onSave={(value) => m.saveSection.mutateAsync({ section: current.key, value })}
                onReview={(checked) => m.review.mutate({ section: current.key, checked }, { onError: () => toast.error(L("没能保存", "Couldn't save")) })}
                onNext={() => {
                  const i = sections.findIndex((s) => s.key === current.key);
                  if (i < sections.length - 1) { setActive(sections[i + 1].key); window.scrollTo({ top: 0, behavior: "smooth" }); }
                }} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Setup({ profile, lang, open, onChange }: { profile: AppProfile; lang: "zh" | "en"; open?: boolean; onChange: (p: { applicant_type?: Applicant; systems?: System[]; open_early?: boolean }) => void }) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const offered = SYSTEMS.filter((s) => s.who.includes(profile.applicant_type));
  const toggle = (k: System, on: boolean) => onChange({ systems: on ? [...profile.systems, k] : profile.systems.filter((x) => x !== k) });
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label>{L("申请类型", "Applying as")}</Label>
        <div className="flex flex-wrap gap-1.5" role="radiogroup">
          {(Object.keys(APPLICANTS) as Applicant[]).map((a) => (
            <button key={a} type="button" role="radio" aria-checked={profile.applicant_type === a}
              onClick={() => {
                // keep only systems that make sense for the new type
                const keep = profile.systems.filter((s) => SYSTEMS.find((x) => x.key === s)?.who.includes(a));
                onChange({ applicant_type: a, systems: a === "graduate" && !keep.length ? ["GR"] : keep });
              }}
              className={`rounded-full border px-3 py-1 text-sm ${profile.applicant_type === a ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {APPLICANTS[a][lang]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{L("要申请的系统（可多选；学生只会看到这些系统需要的字段，没选时只看到基础信息）", "Application systems (students only see what these need; with none, just the basics)")}</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {offered.map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-sm">
              <Checkbox checked={profile.systems.includes(s.key)} onCheckedChange={(on) => toggle(s.key, !!on)} />
              {s[lang]}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t pt-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={profile.open_early} onCheckedChange={(on) => onChange({ open_early: on })} />
          {L("提前开放给学生", "Open to the student early")}
        </label>
        <span className="text-xs text-muted-foreground">
          {open
            ? L("学生现在能在菜单里看到「申请信息」。", "The student can see it now.")
            : L("学生现在看不到。状态变成 College Bound 后会自动开放（转学和硕士学生一直开放），也可以打开这个开关提前开放。", "Hidden until the student is College Bound (always open for transfer and master's students), or switch it on.")}
        </span>
      </div>
    </div>
  );
}

function SectionForm({ section, profile, mode, lang, studentId, activities, onSave, onReview, onNext }: {
  section: Section; profile: AppProfile; mode: "student" | "counselor"; lang: "zh" | "en"; studentId: string;
  activities: ReturnType<typeof useActivities>["data"] & object;
  onSave: (value: Record<string, unknown>) => Promise<unknown>; onReview: (checked: boolean) => void; onNext: () => void;
}) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [draft, setDraft] = useState<Record<string, unknown>>(() => ({ ...(profile.data?.[section.key] ?? {}) }));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<number>();
  const latest = useRef(draft);
  const dirty = useRef(false);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    setState("saving");
    try {
      // keep answers to fields hidden by the current systems; only replace what's shown
      await onSave({ ...(profile.data?.[section.key] ?? {}), ...latest.current });
      setState("saved");
    } catch {
      dirty.current = true;
      setState("error");
    }
  }, [onSave, profile.data, section.key]);

  // save when leaving the section or the page
  useEffect(() => () => { void flush(); }, [flush]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => { if (dirty.current) { void flush(); e.preventDefault(); } };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [flush]);

  const set = (k: string, v: unknown) => {
    setDraft((d) => {
      const next = { ...d, [k]: v };
      latest.current = next;
      return next;
    });
    dirty.current = true;
    setState("idle");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), 900);
  };

  const review = profile.reviews?.[section.key];
  const checked = !!review?.at && !review.needs_review;

  return (
    <section className="min-w-0 space-y-5" aria-labelledby={`sec-${section.key}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`sec-${section.key}`} className="font-serif text-xl font-semibold text-pine">{section[lang]}</h2>
          {section.note && <p className="mt-1 text-sm text-muted-foreground">{lang === "zh" ? section.note : ""}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {state === "saving" ? L("保存中…", "Saving…") : state === "saved" ? L("已自动保存", "Saved") : state === "error" ? <span className="text-destructive">{L("保存失败，会自动重试", "Couldn't save")}</span> : null}
          </span>
          {mode === "counselor" && section.key !== "activities" && (
            <Button size="sm" variant={checked ? "outline" : "default"} onClick={async () => { await flush(); onReview(!checked); }}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" />{checked ? L("取消核对", "Uncheck") : L("标记已核对", "Mark checked")}
            </Button>
          )}
        </div>
      </div>
      {review?.needs_review && (
        <p className="rounded-md border border-brass/40 bg-brass/10 px-3 py-2 text-sm">
          {mode === "counselor" ? L("学生在核对后改过这个板块，请重新看一下。", "The student changed this section after it was checked.") : L("你改过这个板块，顾问会重新核对。", "You changed this section; your counselor will check it again.")}
        </p>
      )}

      {section.key === "activities" ? (
        mode === "student" ? <StudentActivities studentId={studentId} /> : <ActivitySummary activities={activities} lang={lang} />
      ) : (
        <div className="space-y-5">
          {section.fields.map((fl) => (
            <FieldRow key={fl.key} field={fl} value={draft[fl.key]} lang={lang} onChange={(v) => set(fl.key, v)} />
          ))}
        </div>
      )}

      <div className="flex justify-end border-t pt-4">
        <Button variant="outline" onClick={async () => { await flush(); onNext(); }}>{L("保存并继续", "Save and continue")}</Button>
      </div>
    </section>
  );
}

function ActivitySummary({ activities, lang }: { activities: NonNullable<ReturnType<typeof useActivities>["data"]>; lang: "zh" | "en" }) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const list = [...activities].sort(byOrder);
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{L(`活动档案里共 ${list.length} 条，导出时会一起带上。修改请到学生的「资料」页。`, `${list.length} entries in the activity portfolio; they're included in exports. Edit them on the Materials tab.`)}</p>
      <ol className="divide-y rounded-lg border text-sm">
        {list.map((a, i) => (
          <li key={a.id} className="px-3 py-2">
            <span className="text-muted-foreground">{i + 1}. </span>{a.name_en || a.name}
            <span className="ml-2 text-xs text-muted-foreground">{CATEGORIES[a.category][lang]}{period(a, lang) && ` · ${period(a, lang)}`}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FieldRow({ field, value, lang, onChange }: { field: Field; value: unknown; lang: "zh" | "en"; onChange: (v: unknown) => void }) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const id = `f-${field.key}`;
  const label = (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={id}>{field[lang]}</Label>
      {lang === "zh" && <span className="text-xs text-muted-foreground">{field.en}</span>}
      {field.level === "sensitive" && <span className="inline-flex items-center gap-1 text-xs text-brass"><Lock className="h-3 w-3" />{L("仅你和顾问可见", "Only you and your counselors")}</span>}
      {countsToward(field) && !isFilled(field, value) && <span className="text-xs text-muted-foreground">· {L("待填", "to do")}</span>}
    </div>
  );

  if (field.level === "skip") {
    return (
      <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
        <span className="font-medium">{field[lang]}</span>
        <span className="ml-2 text-muted-foreground">{L("不在这里填写，申请时由你本人填", "Not collected here; you'll enter it in the application yourself")}</span>
      </div>
    );
  }

  let input: React.ReactNode;
  if (field.kind === "repeat") input = <RepeatInput field={field} value={value} lang={lang} onChange={onChange} />;
  else if (field.kind === "address") input = <AddressInput id={id} value={(value ?? {}) as Address} lang={lang} onChange={onChange} />;
  else input = <Plain id={id} kind={field.kind as Kind} value={String(value ?? "")} options={field.options} placeholder={field.placeholder} lang={lang} latin={LATIN_ONLY.has(field.key)} onChange={onChange} />;

  return (
    <div className="space-y-1.5">
      {label}
      {input}
      {field.help && <p className="text-xs text-muted-foreground">{lang === "zh" ? field.help : ""}</p>}
    </div>
  );
}

function Plain({ id, kind, value, options, placeholder, lang, latin, onChange }: {
  id: string; kind: Kind | undefined; value: string; options?: string[]; placeholder?: string; lang: "zh" | "en"; latin?: boolean; onChange: (v: string) => void;
}) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const err = latin && hasChinese(value) ? L("这里要填英文或拼音", "Use English letters / pinyin") : problem(kind, value, lang);
  if (kind === "select") {
    return (
      <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
        <SelectTrigger id={id} className="max-w-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>—</SelectItem>
          {(options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }
  const common = { id, value, placeholder: placeholder && (lang === "zh" && !placeholder.startsWith("例") ? `例：${placeholder}` : placeholder), "aria-invalid": !!err, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value) };
  return (
    <>
      {kind === "longtext" ? <Textarea rows={3} maxLength={4000} {...common} />
        : <Input className={kind === "date" || kind === "month" || kind === "number" ? "max-w-[12rem]" : ""} maxLength={300}
            type={kind === "date" ? "date" : kind === "month" ? "month" : kind === "email" ? "email" : kind === "url" ? "url" : kind === "phone" ? "tel" : "text"}
            inputMode={kind === "number" ? "decimal" : undefined} {...common} />}
      {err && <p className="text-xs text-destructive">{err}</p>}
    </>
  );
}

function AddressInput({ id, value, lang, onChange }: { id: string; value: Address; lang: "zh" | "en"; onChange: (v: Address) => void }) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const set = (k: keyof Address, v: string) => onChange({ ...value, [k]: v });
  const parts: [keyof Address, string, string, string][] = [
    ["line1", L("门牌号和街道", "Street address"), "1234 W 10th Ave", "sm:col-span-2"],
    ["line2", L("公寓/单元号（选填）", "Apt / unit (optional)"), "Unit 502", "sm:col-span-2"],
    ["city", L("城市", "City"), "Vancouver", ""], ["region", L("省/州", "Province / state"), "BC", ""],
    ["postal", L("邮编", "Postal code"), "V6H 1A1", ""], ["country", L("国家", "Country"), "Canada", ""],
  ];
  const chinese = Object.values(value).some((v) => hasChinese(String(v ?? "")));
  return (
    <div className="space-y-1.5">
      <div className="grid gap-2 sm:grid-cols-2">
        {parts.map(([k, label, ph, span]) => (
          <div key={k} className={span}>
            <Input id={k === "line1" ? id : undefined} aria-label={label} placeholder={`${label} · ${ph}`} value={String(value[k] ?? "")} maxLength={200} onChange={(e) => set(k, e.target.value)} />
          </div>
        ))}
      </div>
      {chinese && <p className="text-xs text-destructive">{L("地址请用英文填写（中国地址用拼音）", "Write the address in English")}</p>}
    </div>
  );
}

function RepeatInput({ field, value, lang, onChange }: { field: Field; value: unknown; lang: "zh" | "en"; onChange: (v: unknown) => void }) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const rows = (Array.isArray(value) ? value : []) as Record<string, string>[];
  const subs = field.subs ?? [];
  const setRow = (i: number, k: string, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const add = () => onChange([...rows, {}]);
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="relative rounded-md border p-3 pr-10">
          <div className={`grid gap-2 ${subs.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {subs.map((sb: Sub) => {
              const v = String(row[sb.key] ?? "");
              const err = problem(sb.kind, v, lang);
              return (
                <div key={sb.key} className={sb.wide ? "sm:col-span-full" : ""}>
                  <Label className="text-xs text-muted-foreground">{sb[lang]}</Label>
                  {sb.kind === "select" ? (
                    <Select value={v || NONE} onValueChange={(x) => setRow(i, sb.key, x === NONE ? "" : x)}>
                      <SelectTrigger aria-label={sb[lang]}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {(sb.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input aria-label={sb[lang]} value={v} placeholder={sb.placeholder && (lang === "zh" ? `例：${sb.placeholder}` : sb.placeholder)} maxLength={300} aria-invalid={!!err}
                      type={sb.kind === "date" ? "date" : sb.kind === "month" ? "month" : sb.kind === "email" ? "email" : sb.kind === "phone" ? "tel" : "text"}
                      inputMode={sb.kind === "number" ? "decimal" : undefined}
                      onChange={(e) => setRow(i, sb.key, e.target.value)} />
                  )}
                  {err && <p className="text-xs text-destructive">{err}</p>}
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => remove(i)} aria-label={L("删除这一条", "Remove")} className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="mr-1.5 h-4 w-4" />{rows.length ? L("再加一条", "Add another") : L("添加", "Add")}</Button>
    </div>
  );
}

function ExportMenu({ profile, activities, lang }: { profile: AppProfile; activities: NonNullable<ReturnType<typeof useActivities>["data"]>; lang: "zh" | "en" }) {
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const make = (s: System) => buildExport(s, profile.applicant_type, profile.data as Answers, activities);
  const copy = async (s: System) => {
    try {
      await navigator.clipboard.writeText(exportAsText(make(s)));
      toast.success(L("已复制，可以直接粘贴给 AI 填表", "Copied"));
    } catch {
      toast.error(L("复制失败", "Couldn't copy"));
    }
  };
  const download = (s: System) => {
    const blob = new Blob([JSON.stringify(make(s), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `application-${s}-${profile.student_id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const systems = SYSTEMS.filter((s) => profile.systems.includes(s.key));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" />{L("导出", "Export")}</Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {systems.map((s, i) => (
          <div key={s.key}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{s[lang]}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => void copy(s.key)}><ClipboardCopy className="mr-2 h-4 w-4" />{L("复制文字", "Copy as text")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => download(s.key)}><Download className="mr-2 h-4 w-4" />{L("下载 JSON（给 AI 填表）", "Download JSON")}</DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
