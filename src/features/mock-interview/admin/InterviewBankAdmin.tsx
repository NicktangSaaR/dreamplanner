import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useBankAdmin, useBankQuestions, useBanks, type BankInput } from "../useInterviewData";
import {
  PREP_OPTIONS, RESPONSE_OPTIONS, blueprintAvailable, blueprintSeconds, blueprintTotal, formatSeconds,
  type BankKind, type BankQuestion, type BlueprintSection, type InterviewBank, type QuestionType,
  sectionPools, withPools, isFixed, questionSeconds,
} from "../types";
import BulkQuestionInput, { useBulkQuestions } from "../BulkQuestionInput";

const DEFAULT_KEY = "default";
const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

function TimeSelect({
  value, options, onChange, allowDefault, defaultLabel, className,
}: {
  className?: string;
  value: number | null;
  options: number[];
  onChange: (v: number | null) => void;
  allowDefault?: boolean;
  defaultLabel?: string;
}) {
  return (
    <Select
      value={value === null ? DEFAULT_KEY : String(value)}
      onValueChange={(v) => onChange(v === DEFAULT_KEY ? null : Number(v))}
    >
      <SelectTrigger className={className ?? (allowDefault ? "w-48" : "w-32")}><SelectValue /></SelectTrigger>
      <SelectContent>
        {allowDefault && <SelectItem value={DEFAULT_KEY}>{defaultLabel}</SelectItem>}
        {options.map((s) => <SelectItem key={s} value={String(s)}>{formatSeconds(s)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function TypeSelect({ value, onChange }: { value: QuestionType; onChange: (v: QuestionType) => void }) {
  const { t } = useLanguage();
  return (
    <Select value={value} onValueChange={(v) => onChange(v as QuestionType)}>
      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="video">{t("mi.video")}</SelectItem>
        <SelectItem value="written">{t("mi.written")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ------------------------------------------------------------ pool form ---

const emptyInput = (kind: BankKind, bank: InterviewBank | null): BankInput => ({
  kind,
  title: bank?.title ?? "",
  description: bank?.description ?? "",
  school: bank?.school ?? "",
  program: bank?.program ?? "",
  preparation_time: bank?.preparation_time ?? 30,
  response_time: bank?.response_time ?? 60,
  is_active: bank?.is_active ?? true,
  blueprint: bank?.blueprint ?? [],
  sim_shuffle: bank?.sim_shuffle ?? false,
  sim_retakes: bank?.sim_retakes ?? 0,
});

function PoolDialog({
  bank, open, onOpenChange,
}: { bank: InterviewBank | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useLanguage();
  const { saveBank } = useBankAdmin();
  const [form, setForm] = useState<BankInput>(() => emptyInput("pool", bank));

  const submit = async () => {
    if (!form.title.trim()) return;
    try {
      await saveBank.mutateAsync({
        id: bank?.id,
        input: { ...form, title: form.title.trim(), description: form.description?.trim() || null, school: null, program: null },
      });
      toast.success(t("mi.admin.saved"));
      onOpenChange(false);
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{bank ? t("mi3.editPool") : t("mi3.newPool")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pool-title">{t("mi3.poolName")}</Label>
            <Input id="pool-title" value={form.title} placeholder={t("mi3.poolNamePlaceholder")} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pool-desc">{t("mi.admin.description")}</Label>
            <Textarea id="pool-desc" rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <Label>{t("mi3.practicePrep")}</Label>
              <TimeSelect value={form.preparation_time} options={PREP_OPTIONS} onChange={(v) => setForm({ ...form, preparation_time: v ?? 30 })} />
            </div>
            <div className="space-y-2">
              <Label>{t("mi3.practiceResponse")}</Label>
              <TimeSelect value={form.response_time} options={RESPONSE_OPTIONS} onChange={(v) => setForm({ ...form, response_time: v ?? 60 })} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("mi3.poolTimeHint")}</p>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            {form.is_active ? t("mi.admin.active") : t("mi.admin.inactive")}
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("mi.admin.cancel")}</Button>
          <Button onClick={submit} disabled={!form.title.trim() || saveBank.isPending}>
            {saveBank.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t("mi.admin.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------- school form ---

/** Pick one or more pools for a part; with several, its questions are drawn from all of them. */
function PoolPicker({
  pools, questions, value, onChange,
}: {
  pools: InterviewBank[];
  questions: Record<string, BankQuestion[]>;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useLanguage();
  const names = value.map((id) => pools.find((p) => p.id === id)?.title ?? t("mi3.missingPool"));
  const total = new Set(value.flatMap((id) => (questions[id] ?? []).map((q) => q.id))).size;
  const toggle = (id: string, on: boolean) => {
    const next = on ? [...value, id] : value.filter((x) => x !== id);
    if (next.length) onChange(next); // a part needs at least one pool
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-52 justify-between px-3 font-normal">
          <span className="truncate text-left">
            {names.length === 0 ? t("mi3.pickPool") : names.length === 1 ? names[0] : t("mi3.poolsMixed", { first: names[0], n: names.length - 1 })}
          </span>
          <span className="ml-2 shrink-0 text-xs text-muted-foreground">{total}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <p className="px-1 pb-2 text-xs text-muted-foreground">{t("mi3.poolsHint")}</p>
        <ul className="max-h-72 space-y-0.5 overflow-y-auto">
          {pools.map((p) => {
            const on = value.includes(p.id);
            return (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-muted">
                  <Checkbox checked={on} disabled={on && value.length === 1} onCheckedChange={(c) => toggle(p.id, c === true)} />
                  <span className="flex-1">{p.title}</span>
                  <span className="text-xs text-muted-foreground">{questions[p.id]?.length ?? 0}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

const KEEP = "keep";
/** Total times offered for a combined clock. */
const COMBINED_OPTIONS = [45, 60, 75, 90, 120, 150, 180, 240, 300];

function SchoolDialog({
  bank, pools, questions, open, onOpenChange,
}: {
  bank: InterviewBank | null;
  pools: InterviewBank[];
  questions: Record<string, BankQuestion[]>;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useLanguage();
  const { saveBank } = useBankAdmin();
  const [form, setForm] = useState<BankInput>(() => {
    const f = emptyInput("school", bank);
    if (!bank && pools.length) {
      f.blueprint = [{ pool_id: pools[0].id, count: 1, question_type: null, prep: 30, response: 60 }];
    }
    return f;
  });

  const setSection = (i: number, patch: Partial<BlueprintSection>) =>
    setForm({ ...form, blueprint: form.blueprint.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const addSection = () => {
    const last = form.blueprint[form.blueprint.length - 1];
    const used = new Set(form.blueprint.flatMap(sectionPools));
    const next = pools.find((p) => !used.has(p.id)) ?? pools[0];
    if (!next) return;
    setForm({
      ...form,
      blueprint: [...form.blueprint, { pool_id: next.id, count: 1, question_type: last?.question_type ?? null, prep: last?.prep ?? 30, response: last?.response ?? 60 }],
    });
  };
  const moveSection = (i: number, d: -1 | 1) => {
    const b = [...form.blueprint];
    const j = i + d;
    if (j < 0 || j >= b.length) return;
    [b[i], b[j]] = [b[j], b[i]];
    setForm({ ...form, blueprint: b });
  };

  // Warn when the pools cannot supply what the blueprint asks for: parts
  // drawing from the same set of pools share its questions.
  const asked: Record<string, { ids: string[]; n: number }> = {};
  for (const s of form.blueprint) {
    if (isFixed(s)) continue;
    const ids = sectionPools(s);
    const k = [...ids].sort().join("+");
    asked[k] = { ids, n: (asked[k]?.n ?? 0) + s.count };
  }
  const short = Object.values(asked).filter(({ ids, n }) => new Set(ids.flatMap((id) => (questions[id] ?? []).map((q) => q.id))).size < n);

  const valid = !!form.school?.trim() && form.blueprint.length > 0;
  const submit = async () => {
    if (!valid) return;
    const school = form.school!.trim();
    const program = form.program?.trim() || null;
    try {
      await saveBank.mutateAsync({
        id: bank?.id,
        input: {
          ...form,
          title: [school, program].filter(Boolean).join(" · "),
          school,
          program,
          description: form.description?.trim() || null,
          preparation_time: form.blueprint[0]?.prep ?? 30,
          response_time: form.blueprint[0]?.response ?? 60,
        },
      });
      toast.success(t("mi.admin.saved"));
      onOpenChange(false);
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{bank ? t("mi3.editSchool") : t("mi3.newSchool")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="school-name">{t("mi.school")}</Label>
              <Input id="school-name" value={form.school ?? ""} placeholder="UBC" onChange={(e) => setForm({ ...form, school: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school-program">{t("mi.program")}</Label>
              <Input id="school-program" value={form.program ?? ""} placeholder="Sauder School of Business" onChange={(e) => setForm({ ...form, program: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-desc">{t("mi3.schoolNotes")}</Label>
            <Textarea id="school-desc" rows={2} value={form.description ?? ""} placeholder={t("mi3.schoolNotesPlaceholder")} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>{t("mi3.sections")}</Label>
            <p className="text-xs text-muted-foreground">{t("mi3.sectionsHint")}</p>
            <ol className="space-y-2">
              {form.blueprint.map((sec, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
                  <span className="w-5 text-center text-sm text-muted-foreground">{i + 1}</span>
                  <Select value={sec.fixed_text !== undefined ? "fixed" : "pool"}
                    onValueChange={(v) => {
                      if (v === "fixed") setSection(i, { fixed_text: sec.fixed_text ?? "" });
                      else { const { fixed_text: _f, ...rest } = sec; setForm({ ...form, blueprint: form.blueprint.map((x, j) => (j === i ? rest : x)) }); }
                    }}>
                    <SelectTrigger className="w-[136px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pool">{t("mi3.fromPools")}</SelectItem>
                      <SelectItem value="fixed">{t("mi3.fixedQuestion")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {sec.fixed_text !== undefined ? (
                    <Input className="h-9 min-w-[16rem] flex-1" value={sec.fixed_text} placeholder={t("mi3.fixedPlaceholder")}
                      onChange={(e) => setSection(i, { fixed_text: e.target.value })} />
                  ) : (
                    <>
                      <PoolPicker
                        pools={pools}
                        questions={questions}
                        value={sectionPools(sec)}
                        onChange={(ids) => setForm({ ...form, blueprint: form.blueprint.map((s, j) => (j === i ? withPools(s, ids) : s)) })}
                      />
                      <Select value={String(sec.count)} onValueChange={(v) => setSection(i, { count: Number(v) })}>
                        <SelectTrigger className="w-[112px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <SelectItem key={n} value={String(n)}>{t("mi2.nQuestions", { n })}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  <Select value={sec.question_type ?? KEEP} onValueChange={(v) => setSection(i, { question_type: v === KEEP ? null : (v as QuestionType) })}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={KEEP}>{t("mi3.typeKeep")}</SelectItem>
                      <SelectItem value="video">{t("mi.video")}</SelectItem>
                      <SelectItem value="written">{t("mi.written")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="basis-full" />
                  <span className="w-5" />
                  <Select value={sec.combined ? "combined" : "separate"}
                    onValueChange={(v) => setSection(i, v === "combined"
                      // keep the overall time the same when switching
                      ? { combined: true, response: sec.prep + sec.response, prep: Math.min(sec.prep, sec.prep + sec.response) }
                      : { combined: false, response: Math.max(15, sec.response - sec.prep) })}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="separate">{t("mi3.timingSeparate")}</SelectItem>
                      <SelectItem value="combined">{t("mi3.timingCombined")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {sec.combined ? (
                    <>
                      <span className="text-xs text-muted-foreground">{t("mi.totalTime")}</span>
                      <TimeSelect className="w-[84px]" value={sec.response} options={COMBINED_OPTIONS} onChange={(v) => setSection(i, { response: v ?? 90 })} />
                      <span className="text-xs text-muted-foreground">{t("mi.maxThinking")}</span>
                      <TimeSelect className="w-[84px]" value={sec.prep} options={PREP_OPTIONS.filter((x) => x < sec.response)} onChange={(v) => setSection(i, { prep: v ?? 30 })} />
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">{t("mi.prep")}</span>
                      <TimeSelect className="w-[84px]" value={sec.prep} options={PREP_OPTIONS} onChange={(v) => setSection(i, { prep: v ?? 30 })} />
                      <span className="text-xs text-muted-foreground">{t("mi.response")}</span>
                      <TimeSelect className="w-[84px]" value={sec.response} options={RESPONSE_OPTIONS} onChange={(v) => setSection(i, { response: v ?? 60 })} />
                    </>
                  )}
                  <span className="ml-auto flex">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label={t("mi3.moveUp")}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSection(i, 1)} disabled={i === form.blueprint.length - 1} aria-label={t("mi3.moveDown")}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("mi.delete")}
                      onClick={() => setForm({ ...form, blueprint: form.blueprint.filter((_, j) => j !== i) })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </span>
                </li>
              ))}
            </ol>
            <Button variant="outline" size="sm" onClick={addSection} disabled={!pools.length}>
              <Plus className="mr-1.5 h-4 w-4" /> {t("mi3.addSection")}
            </Button>
            <p className="text-sm">
              {t("mi3.blueprintSummary", { n: blueprintTotal(form.blueprint), time: formatSeconds(blueprintSeconds(form.blueprint)) })}
            </p>
            {short.length > 0 && (
              <p className="text-sm text-destructive">
                {t("mi3.shortWarning", { pools: short.map(({ ids }) => ids.map((id) => pools.find((p) => p.id === id)?.title ?? "?").join(" + ")).join("、") })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("mi2.admin.simOrder")}</Label>
              <Select value={form.sim_shuffle ? "random" : "fixed"} onValueChange={(v) => setForm({ ...form, sim_shuffle: v === "random" })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t("mi3.orderSections")}</SelectItem>
                  <SelectItem value="random">{t("mi3.orderMixed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("mi.retakes")}</Label>
              <Select value={String(form.sim_retakes)} onValueChange={(v) => setForm({ ...form, sim_retakes: Number(v) })}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("mi.retakes0")}</SelectItem>
                  <SelectItem value="1">{t("mi.retakes1")}</SelectItem>
                  <SelectItem value="2">{t("mi.retakes2")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-3 self-end pb-2 text-sm">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              {form.is_active ? t("mi3.schoolActive") : t("mi.admin.inactive")}
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("mi.admin.cancel")}</Button>
          <Button onClick={submit} disabled={!valid || saveBank.isPending}>
            {saveBank.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t("mi.admin.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------- question row ---

function QuestionRow({ q, bank }: { q: BankQuestion; bank: InterviewBank }) {
  const { t } = useLanguage();
  const { updateQuestion, deleteQuestion } = useBankAdmin();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(q.title);
  const [type, setType] = useState<QuestionType>(q.question_type);
  const [prep, setPrep] = useState<number | null>(q.preparation_time);
  const [resp, setResp] = useState<number | null>(q.response_time);

  const save = async () => {
    if (!title.trim()) return;
    try {
      await updateQuestion.mutateAsync({
        id: q.id,
        input: { title: title.trim(), question_type: type, preparation_time: prep, response_time: resp },
      });
      setEditing(false);
      toast.success(t("mi.admin.saved"));
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const remove = async () => {
    if (!window.confirm(t("mi.admin.deleteQuestionConfirm"))) return;
    try {
      await deleteQuestion.mutateAsync(q.id);
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  if (editing) {
    return (
      <li className="space-y-3 bg-muted/40 px-4 py-3">
        <Textarea rows={2} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={1000} />
        <div className="flex flex-wrap items-center gap-3">
          <TypeSelect value={type} onChange={setType} />
          <TimeSelect value={prep} options={PREP_OPTIONS} onChange={setPrep} allowDefault defaultLabel={`${t("mi.admin.useDefault")} (${formatSeconds(bank.preparation_time)})`} />
          <TimeSelect value={resp} options={RESPONSE_OPTIONS} onChange={setResp} allowDefault defaultLabel={`${t("mi.admin.useDefault")} (${formatSeconds(bank.response_time)})`} />
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>{t("mi.admin.cancel")}</Button>
            <Button size="sm" onClick={save} disabled={updateQuestion.isPending}>{t("mi.admin.save")}</Button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="flex-1">
        <p className="leading-snug">{q.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {q.question_type === "written" ? t("mi.written") : t("mi.video")} · {t("mi.prep")}{" "}
          {formatSeconds(q.preparation_time ?? bank.preparation_time)} · {t("mi.response")}{" "}
          {formatSeconds(q.response_time ?? bank.response_time)}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label={t("mi.admin.editQuestion")}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={remove} aria-label={t("mi.delete")}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

// -------------------------------------------------------- import panel ---

function ImportPanel({ bank, existing }: { bank: InterviewBank; existing: BankQuestion[] }) {
  const { t } = useLanguage();
  const { importQuestions } = useBankAdmin();
  const existingTitles = useMemo(() => existing.map((q) => q.title), [existing]);
  const bulk = useBulkQuestions(existingTitles);
  const [type, setType] = useState<QuestionType>("video");
  const [prep, setPrep] = useState<number | null>(null);
  const [resp, setResp] = useState<number | null>(null);

  const submit = async () => {
    if (!bulk.fresh.length) return;
    try {
      await importQuestions.mutateAsync({
        bankId: bank.id,
        startOrder: existing.reduce((m, q) => Math.max(m, q.sort_order), 0),
        rows: bulk.fresh.map((title) => {
          const m = bulk.meta[title] ?? {};
          return {
            title,
            question_type: m.type ?? type,
            preparation_time: m.prep ?? prep,
            response_time: m.response ?? resp,
          };
        }),
      });
      toast.success(t("mi.admin.imported", { n: bulk.fresh.length }));
      bulk.reset();
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <div className="space-y-3 border-t bg-muted/30 p-4">
      <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> {t("mi3.adminImport")}</Label>
      <p className="text-xs text-muted-foreground">{t("mi3.adminImportHint")}</p>
      <BulkQuestionInput bulk={bulk} rows={6} placeholder={"1. Tell us about yourself.\n2. Why {school}?\n3. Describe a time you led a team."} />
      <div className="flex flex-wrap items-center gap-3">
        <TypeSelect value={type} onChange={setType} />
        <TimeSelect value={prep} options={PREP_OPTIONS} onChange={setPrep} allowDefault defaultLabel={`${t("mi.prep")}: ${t("mi.admin.useDefault")}`} />
        <TimeSelect value={resp} options={RESPONSE_OPTIONS} onChange={setResp} allowDefault defaultLabel={`${t("mi.response")}: ${t("mi.admin.useDefault")}`} />
        <Button className="ml-auto" onClick={submit} disabled={!bulk.fresh.length || importQuestions.isPending}>
          {importQuestions.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {bulk.fresh.length > 0 ? t("mi3.importN", { n: bulk.fresh.length }) : t("mi.admin.importButton")}
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ main view ---

type Tab = "schools" | "pools";

export default function InterviewBankAdmin() {
  const { t } = useLanguage();
  const { data: banks = [], isLoading } = useBanks();
  const { data: questions = {} } = useBankQuestions();
  const { setActive, deleteBank } = useBankAdmin();
  const [tab, setTab] = useState<Tab>("schools");
  const [openId, setOpenId] = useState<string | null>(null);
  const [poolDialog, setPoolDialog] = useState<{ bank: InterviewBank | null } | null>(null);
  const [schoolDialog, setSchoolDialog] = useState<{ bank: InterviewBank | null } | null>(null);

  const pools = banks.filter((b) => b.kind === "pool");
  const activePools = pools.filter((b) => b.is_active);
  const schools = banks
    .filter((b) => b.kind === "school")
    .sort((a, b) => (a.school || a.title).localeCompare(b.school || b.title));
  const poolTitle = Object.fromEntries(pools.map((p) => [p.id, p.title]));
  const usedBy = (poolId: string) => schools.filter((s) => s.blueprint.some((sec) => sectionPools(sec).includes(poolId)));

  const removeBank = async (bank: InterviewBank) => {
    let msg: string;
    if (bank.kind === "pool") {
      const users = usedBy(bank.id);
      msg = users.length
        ? t("mi3.deletePoolInUse", { title: bank.title, schools: users.map((s) => s.title).join("、") })
        : t("mi.admin.deleteBankConfirm", { title: bank.title, n: questions[bank.id]?.length ?? 0 });
    } else {
      msg = t("mi3.deleteSchoolConfirm", { title: bank.title });
    }
    if (!window.confirm(msg)) return;
    try {
      await deleteBank.mutateAsync(bank.id);
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const ActiveSwitch = ({ bank }: { bank: InterviewBank }) => (
    <label className="flex items-center gap-2 text-sm">
      <Switch
        checked={bank.is_active}
        onCheckedChange={(v) => setActive.mutate({ id: bank.id, active: v }, { onError: (e) => toast.error(errorText(e)) })}
      />
      <span className={bank.is_active ? "text-primary" : "text-muted-foreground"}>
        {bank.is_active ? t("mi.admin.active") : t("mi.admin.inactive")}
      </span>
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold text-pine">{t("mi.admin.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("mi3.adminSubtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border bg-card p-1" role="tablist">
          {(["schools", "pools"] as Tab[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn("rounded-sm px-4 py-1.5 text-sm", tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {k === "schools" ? t("mi3.tabSchools", { n: schools.length }) : t("mi3.tabPools", { n: pools.length })}
            </button>
          ))}
        </div>
        {tab === "schools" ? (
          <Button onClick={() => setSchoolDialog({ bank: null })} disabled={!activePools.length}>
            <Plus className="mr-1.5 h-4 w-4" /> {t("mi3.newSchool")}
          </Button>
        ) : (
          <Button onClick={() => setPoolDialog({ bank: null })}>
            <Plus className="mr-1.5 h-4 w-4" /> {t("mi3.newPool")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : tab === "schools" ? (
        schools.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("mi3.noSchools")}</p>
        ) : (
          <ul className="space-y-3">
            {schools.map((bank) => {
              const available = blueprintAvailable(bank, questions);
              const total = blueprintTotal(bank.blueprint);
              return (
                <li key={bank.id} className="rounded-md border bg-card p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{bank.school || bank.title}{bank.program && <span className="font-normal text-muted-foreground"> · {bank.program}</span>}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {total > 0
                          ? `${t("mi3.blueprintSummary", { n: total, time: formatSeconds(blueprintSeconds(bank.blueprint)) })} · ${
                              bank.sim_retakes === 0 ? t("mi.retakes0") : bank.sim_retakes === 1 ? t("mi.retakes1") : t("mi.retakes2")
                            } · ${bank.sim_shuffle ? t("mi3.orderMixed") : t("mi3.orderSections")}`
                          : t("mi3.noSections")}
                      </p>
                    </div>
                    <ActiveSwitch bank={bank} />
                    <Button variant="ghost" size="icon" onClick={() => setSchoolDialog({ bank })} aria-label={t("mi3.editSchool")}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeBank(bank)} aria-label={t("mi.delete")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {bank.blueprint.length > 0 && (
                    <ol className="mt-3 flex flex-wrap gap-2">
                      {bank.blueprint.map((sec, i) => (
                        <li key={i} className="rounded-md border bg-muted/30 px-2.5 py-1 text-xs">
                          <span className="font-medium">{i + 1}. {isFixed(sec) ? `${t("mi3.fixedQuestion")}：${sec.fixed_text}` : sectionPools(sec).map((id) => poolTitle[id] ?? t("mi3.missingPool")).join(" / ")}</span>
                          <span className="text-muted-foreground">
                            {isFixed(sec) ? "" : ` ×${sec.count}`} · {sec.question_type ? t(sec.question_type === "written" ? "mi.written" : "mi.video") + " · " : ""}
                            {sec.combined ? t("mi3.combinedShort", { total: formatSeconds(questionSeconds(sec)), think: formatSeconds(sec.prep) }) : `${formatSeconds(sec.prep)} / ${formatSeconds(sec.response)}`}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {total > 0 && available < total && (
                    <p className="mt-2 text-xs text-destructive">{t("mi3.shortNow", { n: available, total })}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )
      ) : pools.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("mi.admin.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {pools.map((bank) => {
            const qs = questions[bank.id] ?? [];
            const open = openId === bank.id;
            const users = usedBy(bank.id);
            return (
              <li key={bank.id} className="overflow-hidden rounded-md border bg-card">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <button
                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                    onClick={() => setOpenId(open ? null : bank.id)}
                    aria-expanded={open}
                  >
                    {open ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span className="min-w-0">
                      <span className="block font-medium">{bank.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t("mi.admin.questions", { n: qs.length })}
                        {users.length > 0 && ` · ${t("mi3.usedBy", { n: users.length })}`}
                        {bank.description && ` · ${bank.description}`}
                      </span>
                    </span>
                  </button>
                  <ActiveSwitch bank={bank} />
                  <Button variant="ghost" size="icon" onClick={() => setPoolDialog({ bank })} aria-label={t("mi3.editPool")}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeBank(bank)} aria-label={t("mi.delete")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {open && (
                  <>
                    {qs.length === 0 ? (
                      <p className="border-t px-4 py-3 text-sm text-muted-foreground">{t("mi.admin.noQuestions")}</p>
                    ) : (
                      <ul className="divide-y border-t">
                        {qs.map((q) => <QuestionRow key={q.id} q={q} bank={bank} />)}
                      </ul>
                    )}
                    <ImportPanel bank={bank} existing={qs} />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {poolDialog && (
        <PoolDialog key={poolDialog.bank?.id ?? "new"} bank={poolDialog.bank} open onOpenChange={(o) => !o && setPoolDialog(null)} />
      )}
      {schoolDialog && (
        <SchoolDialog
          key={schoolDialog.bank?.id ?? "new"}
          bank={schoolDialog.bank}
          pools={activePools}
          questions={questions}
          open
          onOpenChange={(o) => !o && setSchoolDialog(null)}
        />
      )}
    </div>
  );
}
