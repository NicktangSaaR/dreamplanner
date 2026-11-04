import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useBankAdmin, useBankQuestions, useBanks, type BankInput } from "../useInterviewData";
import {
  PREP_OPTIONS, RESPONSE_OPTIONS, formatSeconds, parsePastedQuestions,
  type BankQuestion, type InterviewBank, type QuestionType,
} from "../types";

const DEFAULT_KEY = "default";
const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

function TimeSelect({
  value, options, onChange, allowDefault, defaultLabel,
}: {
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
      <SelectTrigger className={allowDefault ? "w-48" : "w-32"}><SelectValue /></SelectTrigger>
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

// ------------------------------------------------------------ bank form ---

function BankDialog({
  bank, open, onOpenChange,
}: { bank: InterviewBank | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useLanguage();
  const { saveBank } = useBankAdmin();
  const [form, setForm] = useState<BankInput>(() => ({
    title: bank?.title ?? "",
    description: bank?.description ?? "",
    school: bank?.school ?? "",
    program: bank?.program ?? "",
    preparation_time: bank?.preparation_time ?? 30,
    response_time: bank?.response_time ?? 60,
    is_active: bank?.is_active ?? true,
  }));

  const submit = async () => {
    if (!form.title.trim()) return;
    try {
      await saveBank.mutateAsync({
        id: bank?.id,
        input: {
          ...form,
          title: form.title.trim(),
          description: form.description?.trim() || null,
          school: form.school?.trim() || null,
          program: form.program?.trim() || null,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{bank ? t("mi.admin.editBank") : t("mi.admin.newBank")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank-title">{t("mi.admin.bankTitle")}</Label>
            <Input id="bank-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-desc">{t("mi.admin.description")}</Label>
            <Textarea id="bank-desc" rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank-school">{t("mi.school")}</Label>
              <Input id="bank-school" value={form.school ?? ""} onChange={(e) => setForm({ ...form, school: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-program">{t("mi.program")}</Label>
              <Input id="bank-program" value={form.program ?? ""} onChange={(e) => setForm({ ...form, program: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("mi.placeholderHint")}</p>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <Label>{t("mi.admin.defaultPrep")}</Label>
              <TimeSelect value={form.preparation_time} options={PREP_OPTIONS} onChange={(v) => setForm({ ...form, preparation_time: v ?? 30 })} />
            </div>
            <div className="space-y-2">
              <Label>{t("mi.admin.defaultResponse")}</Label>
              <TimeSelect value={form.response_time} options={RESPONSE_OPTIONS} onChange={(v) => setForm({ ...form, response_time: v ?? 60 })} />
            </div>
          </div>
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
  const [text, setText] = useState("");
  const [type, setType] = useState<QuestionType>("video");
  const [prep, setPrep] = useState<number | null>(null);
  const [resp, setResp] = useState<number | null>(null);
  const parsed = useMemo(() => parsePastedQuestions(text), [text]);

  const submit = async () => {
    if (!parsed.length) return;
    try {
      await importQuestions.mutateAsync({
        bankId: bank.id,
        startOrder: existing.reduce((m, q) => Math.max(m, q.sort_order), 0),
        rows: parsed.map((title) => ({ title, question_type: type, preparation_time: prep, response_time: resp })),
      });
      toast.success(t("mi.admin.imported", { n: parsed.length }));
      setText("");
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <div className="space-y-3 border-t bg-muted/30 p-4">
      <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> {t("mi.admin.import")}</Label>
      <p className="text-xs text-muted-foreground">{t("mi.admin.importHint")}</p>
      <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"1. Tell us about yourself.\n2. Why {school}?\n3. Describe a time you led a team."} />
      <div className="flex flex-wrap items-center gap-3">
        <TypeSelect value={type} onChange={setType} />
        <TimeSelect value={prep} options={PREP_OPTIONS} onChange={setPrep} allowDefault defaultLabel={`${t("mi.prep")}: ${t("mi.admin.useDefault")}`} />
        <TimeSelect value={resp} options={RESPONSE_OPTIONS} onChange={setResp} allowDefault defaultLabel={`${t("mi.response")}: ${t("mi.admin.useDefault")}`} />
        <span className="text-sm text-muted-foreground">{parsed.length > 0 && t("mi.admin.importPreview", { n: parsed.length })}</span>
        <Button className="ml-auto" onClick={submit} disabled={!parsed.length || importQuestions.isPending}>
          {importQuestions.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {t("mi.admin.importButton")}
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ main view ---

export default function InterviewBankAdmin() {
  const { t } = useLanguage();
  const { data: banks = [], isLoading } = useBanks();
  const { data: questions = {} } = useBankQuestions();
  const { setActive, deleteBank } = useBankAdmin();
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ bank: InterviewBank | null } | null>(null);

  const removeBank = async (bank: InterviewBank) => {
    const n = questions[bank.id]?.length ?? 0;
    if (!window.confirm(t("mi.admin.deleteBankConfirm", { title: bank.title, n }))) return;
    try {
      await deleteBank.mutateAsync(bank.id);
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-pine">{t("mi.admin.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("mi.admin.subtitle")}</p>
        </div>
        <Button onClick={() => setDialog({ bank: null })}>
          <Plus className="mr-1.5 h-4 w-4" /> {t("mi.admin.newBank")}
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : banks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("mi.admin.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {banks.map((bank) => {
            const qs = questions[bank.id] ?? [];
            const open = openId === bank.id;
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
                        {(bank.school || bank.program) && ` · ${[bank.school, bank.program].filter(Boolean).join(" / ")}`}
                        {` · ${t("mi.prep")} ${formatSeconds(bank.preparation_time)} / ${t("mi.response")} ${formatSeconds(bank.response_time)}`}
                      </span>
                    </span>
                  </button>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={bank.is_active}
                      onCheckedChange={(v) => setActive.mutate({ id: bank.id, active: v }, { onError: (e) => toast.error(errorText(e)) })}
                    />
                    <span className={bank.is_active ? "text-primary" : "text-muted-foreground"}>
                      {bank.is_active ? t("mi.admin.active") : t("mi.admin.inactive")}
                    </span>
                  </label>
                  <Button variant="ghost" size="icon" onClick={() => setDialog({ bank })} aria-label={t("mi.admin.editBank")}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeBank(bank)} aria-label={t("mi.admin.deleteBank")}>
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

      {dialog && (
        <BankDialog
          key={dialog.bank?.id ?? "new"}
          bank={dialog.bank}
          open
          onOpenChange={(o) => !o && setDialog(null)}
        />
      )}
    </div>
  );
}
