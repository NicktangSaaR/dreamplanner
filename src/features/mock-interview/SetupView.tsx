import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useBankQuestions, useBanks, useCustomQuestionMutations, useCustomQuestions } from "./useInterviewData";
import {
  PREP_OPTIONS, RESPONSE_OPTIONS, fillPlaceholders, formatSeconds,
  type QuestionType, type SessionQuestion, type SessionSettings,
} from "./types";

interface Props {
  userId: string;
  initialSettings: SessionSettings;
  initialSelection: string[];
  onStart: (questions: SessionQuestion[], settings: SessionSettings, selection: string[]) => void;
}

function TypeTiming({ type, prep, response }: { type: QuestionType; prep: number; response: number }) {
  const { t } = useLanguage();
  return (
    <span className="text-xs text-muted-foreground">
      {type === "written" ? t("mi.written") : t("mi.video")} · {t("mi.prep")} {formatSeconds(prep)} ·{" "}
      {t("mi.response")} {formatSeconds(response)}
    </span>
  );
}

export default function SetupView({ userId, initialSettings, initialSelection, onStart }: Props) {
  const { t } = useLanguage();
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const { data: bankQuestions = {}, isLoading: questionsLoading } = useBankQuestions();
  const { data: custom = [] } = useCustomQuestions(userId);
  const { add, remove } = useCustomQuestionMutations(userId);

  const usableBanks = useMemo(
    () => banks.filter((b) => b.is_active && (bankQuestions[b.id]?.length ?? 0) > 0),
    [banks, bankQuestions],
  );
  const [bankId, setBankId] = useState<string>("");
  const [settings, setSettings] = useState<SessionSettings>(initialSettings);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection));

  // New custom question form
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<QuestionType>("video");
  const [newPrep, setNewPrep] = useState(30);
  const [newResponse, setNewResponse] = useState(60);

  useEffect(() => {
    if (!bankId && usableBanks.length) setBankId(usableBanks[0].id);
  }, [bankId, usableBanks]);

  const bank = usableBanks.find((b) => b.id === bankId);

  // Pick up the bank's school/program unless the student already typed their own.
  useEffect(() => {
    if (!bank) return;
    setSettings((s) => ({
      ...s,
      school: s.school || bank.school || "",
      program: s.program || bank.program || "",
    }));
  }, [bank]);

  // Every question the student could pick, keyed for selection.
  const allQuestions = useMemo(() => {
    const map = new Map<string, SessionQuestion>();
    for (const b of usableBanks) {
      for (const q of bankQuestions[b.id] ?? []) {
        map.set(`bank:${q.id}`, {
          key: `bank:${q.id}`,
          text: q.title,
          type: q.question_type,
          prep: q.preparation_time ?? b.preparation_time,
          response: q.response_time ?? b.response_time,
        });
      }
    }
    for (const c of custom) {
      map.set(`custom:${c.id}`, {
        key: `custom:${c.id}`,
        text: c.title,
        type: c.question_type,
        prep: c.preparation_time,
        response: c.response_time,
      });
    }
    return map;
  }, [usableBanks, bankQuestions, custom]);

  const chosen = [...selected].map((k) => allQuestions.get(k)).filter(Boolean) as SessionQuestion[];
  const totalTime = chosen.reduce((sum, q) => sum + q.prep + q.response, 0);

  const toggle = (key: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const bankKeys = (bank ? bankQuestions[bank.id] ?? [] : []).map((q) => `bank:${q.id}`);
  const customKeys = custom.map((c) => `custom:${c.id}`);
  const setMany = (keys: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (on ? next.add(k) : next.delete(k)));
      return next;
    });

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    try {
      await add.mutateAsync({ title: text, question_type: newType, preparation_time: newPrep, response_time: newResponse });
      setNewText("");
      toast.success(t("mi.added"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(`custom:${id}`);
        return next;
      });
      toast.success(t("mi.deleted"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleStart = () => {
    if (!chosen.length) {
      toast.error(t("mi.selectAtLeastOne"));
      return;
    }
    // Keep the order the questions appear in, unless shuffling.
    const ordered = [...allQuestions.values()].filter((q) => selected.has(q.key));
    if (settings.shuffle) {
      for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
    }
    onStart(ordered, settings, [...selected]);
  };

  const loading = banksLoading || questionsLoading;

  return (
    <div className="pb-28">
      <header className="max-w-3xl">
        <h1 className="font-serif text-3xl font-bold text-pine sm:text-4xl">{t("mi.title")}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t("mi.subtitle")}</p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Settings */}
        <aside className="h-fit space-y-5 rounded-md border bg-card p-5">
          <h2 className="font-semibold text-pine">{t("mi.settings")}</h2>
          <div className="space-y-2">
            <Label htmlFor="mi-school">{t("mi.school")}</Label>
            <Input id="mi-school" value={settings.school} onChange={(e) => setSettings({ ...settings, school: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mi-program">{t("mi.program")}</Label>
            <Input id="mi-program" value={settings.program} onChange={(e) => setSettings({ ...settings, program: e.target.value })} />
          </div>
          <p className="text-xs text-muted-foreground">{t("mi.placeholderHint")}</p>
          <div className="space-y-2">
            <Label>{t("mi.retakes")}</Label>
            <Select value={String(settings.retakes)} onValueChange={(v) => setSettings({ ...settings, retakes: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("mi.retakes0")}</SelectItem>
                <SelectItem value="1">{t("mi.retakes1")}</SelectItem>
                <SelectItem value="2">{t("mi.retakes2")}</SelectItem>
                <SelectItem value="99">{t("mi.retakesUnlimited")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={settings.shuffle} onCheckedChange={(v) => setSettings({ ...settings, shuffle: v === true })} />
            {t("mi.shuffle")}
          </label>
        </aside>

        {/* Questions */}
        <section className="rounded-md border bg-card p-5">
          <h2 className="font-semibold text-pine">{t("mi.chooseQuestions")}</h2>
          <Tabs defaultValue="bank" className="mt-4">
            <TabsList>
              <TabsTrigger value="bank">{t("mi.tabBank")}</TabsTrigger>
              <TabsTrigger value="mine">
                {t("mi.tabMine")}
                {custom.length > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{custom.length}</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bank" className="mt-4">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : usableBanks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("mi.noBanks")}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[240px] flex-1 space-y-2">
                      <Label>{t("mi.bank")}</Label>
                      <Select value={bankId} onValueChange={setBankId}>
                        <SelectTrigger><SelectValue placeholder={t("mi.chooseBank")} /></SelectTrigger>
                        <SelectContent>
                          {usableBanks.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.title} ({bankQuestions[b.id]?.length ?? 0})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setMany(bankKeys, true)}>{t("mi.selectAll")}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setMany(bankKeys, false)}>{t("mi.clearAll")}</Button>
                  </div>
                  {bank?.description && <p className="mt-3 text-sm text-muted-foreground">{bank.description}</p>}
                  <ul className="mt-4 divide-y rounded-md border">
                    {(bank ? bankQuestions[bank.id] ?? [] : []).map((q) => {
                      const key = `bank:${q.id}`;
                      const sq = allQuestions.get(key)!;
                      return (
                        <li key={q.id}>
                          <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-muted/50">
                            <Checkbox className="mt-0.5" checked={selected.has(key)} onCheckedChange={(v) => toggle(key, v === true)} />
                            <span className="flex-1">
                              <span className="block leading-snug">{fillPlaceholders(q.title, settings.school, settings.program)}</span>
                              <TypeTiming type={sq.type} prep={sq.prep} response={sq.response} />
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </TabsContent>

            <TabsContent value="mine" className="mt-4">
              <p className="text-xs text-muted-foreground">{t("mi.mineVisibility")}</p>
              {custom.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">{t("mi.mineEmpty")}</p>
              ) : (
                <>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setMany(customKeys, true)}>{t("mi.selectAll")}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setMany(customKeys, false)}>{t("mi.clearAll")}</Button>
                  </div>
                  <ul className="mt-3 divide-y rounded-md border">
                    {custom.map((c) => {
                      const key = `custom:${c.id}`;
                      return (
                        <li key={c.id} className="flex items-start gap-3 px-4 py-3">
                          <Checkbox className="mt-0.5" checked={selected.has(key)} onCheckedChange={(v) => toggle(key, v === true)} aria-label={c.title} />
                          <span className="flex-1">
                            <span className="block leading-snug">{fillPlaceholders(c.title, settings.school, settings.program)}</span>
                            <TypeTiming type={c.question_type} prep={c.preparation_time} response={c.response_time} />
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} aria-label={t("mi.delete")}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <div className="mt-6 space-y-3 rounded-md bg-muted/40 p-4">
                <Label htmlFor="mi-new">{t("mi.newQuestion")}</Label>
                <Textarea id="mi-new" rows={2} maxLength={1000} placeholder={t("mi.newQuestionPlaceholder")} value={newText} onChange={(e) => setNewText(e.target.value)} />
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("mi.type")}</Label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as QuestionType)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">{t("mi.video")}</SelectItem>
                        <SelectItem value="written">{t("mi.written")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("mi.prep")}</Label>
                    <Select value={String(newPrep)} onValueChange={(v) => setNewPrep(Number(v))}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>{PREP_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>{formatSeconds(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("mi.response")}</Label>
                    <Select value={String(newResponse)} onValueChange={(v) => setNewResponse(Number(v))}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>{RESPONSE_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>{formatSeconds(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAdd} disabled={!newText.trim() || add.isPending}>
                    {add.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
                    {t("mi.add")}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>

      {/* Sticky summary bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {t("mi.selectedSummary", { count: chosen.length, time: formatSeconds(totalTime) })}
          </span>
          <Button size="lg" onClick={handleStart} disabled={!chosen.length}>{t("mi.start")}</Button>
        </div>
      </div>
    </div>
  );
}
