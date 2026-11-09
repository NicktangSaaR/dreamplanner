import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, GraduationCap, Loader2, Plus, Shuffle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import BulkQuestionInput, { useBulkQuestions } from "./BulkQuestionInput";
import { useBankQuestions, useBanks, useCustomQuestionMutations, useCustomQuestions } from "./useInterviewData";
import {
  PREP_OPTIONS, RESPONSE_OPTIONS, blueprintAvailable, blueprintSeconds, drawFromBlueprint, drawRandom, recentQuestionKeys, rememberQuestions, fillPlaceholders, formatSeconds,
  type InterviewBank, type QuestionType, type SessionQuestion, type SessionSettings,
} from "./types";
import type { SessionMeta } from "./sessionLog";

interface Props {
  userId: string;
  initialSettings: SessionSettings;
  initialSelection: string[];
  onStart: (questions: SessionQuestion[], settings: SessionSettings, selection: string[], meta: SessionMeta) => void;
}

type Mode = "simulation" | "practice";
type Pick = "single" | "multiple" | "random";
const ALL = "__all__";
const MINE = "__mine__";
const DEFAULT = "default";

/**
 * Two ways in:
 *  - Full simulation: a university + program set up by the admin, run
 *    exactly as configured (question count, order, timing, retakes).
 *  - Practice: pick one question, several, or a random set from any bank or
 *    the student's own questions, and choose the preparation and answer time.
 */
export default function SetupView({ userId, initialSettings, onStart }: Props) {
  const { t } = useLanguage();
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const { data: bankQuestions = {}, isLoading: questionsLoading } = useBankQuestions();
  const { data: custom = [] } = useCustomQuestions(userId);
  const { add, remove } = useCustomQuestionMutations(userId);

  const usableBanks = useMemo(
    () => banks.filter((b) => b.kind === "pool" && b.is_active && (bankQuestions[b.id]?.length ?? 0) > 0),
    [banks, bankQuestions],
  );
  const poolTitle = useMemo(() => Object.fromEntries(banks.map((b) => [b.id, b.title])), [banks]);
  const simulations = useMemo(
    () =>
      banks
        .filter((b) => b.kind === "school" && b.is_active && blueprintAvailable(b, bankQuestions) > 0)
        .sort((a, b) => (a.school || a.title).localeCompare(b.school || b.title)),
    [banks, bankQuestions],
  );

  const [mode, setMode] = useState<Mode>("simulation");
  const [simId, setSimId] = useState("");
  const [pool, setPool] = useState(ALL);
  const [pick, setPick] = useState<Pick>("multiple");
  const [single, setSingle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [randomCount, setRandomCount] = useState(3);
  const [prep, setPrep] = useState<string>(DEFAULT);
  const [response, setResponse] = useState<string>(DEFAULT);
  const [retakes, setRetakes] = useState(initialSettings.retakes ?? 1);
  const [school, setSchool] = useState(initialSettings.school || "");
  const [program, setProgram] = useState(initialSettings.program || "");

  // New custom question form
  const customTitles = useMemo(() => custom.map((c) => c.title), [custom]);
  const bulk = useBulkQuestions(customTitles);
  const [newType, setNewType] = useState<QuestionType>("video");

  useEffect(() => {
    if (!simId && simulations.length) setSimId(simulations[0].id);
  }, [simId, simulations]);
  useEffect(() => {
    if (!banksLoading && !questionsLoading && simulations.length === 0) setMode("practice");
  }, [banksLoading, questionsLoading, simulations.length]);

  const toSession = (b: InterviewBank | null, q: { id: string; title: string; question_type: QuestionType; preparation_time: number | null; response_time: number | null }, key: string): SessionQuestion => ({
    key,
    text: q.title,
    type: q.question_type,
    prep: q.preparation_time ?? b?.preparation_time ?? 30,
    response: q.response_time ?? b?.response_time ?? 60,
  });

  // Practice pool
  const poolQuestions = useMemo(() => {
    const list: SessionQuestion[] = [];
    const banksInPool = pool === ALL ? usableBanks : usableBanks.filter((b) => b.id === pool);
    if (pool !== MINE) {
      for (const b of banksInPool) for (const q of bankQuestions[b.id] ?? []) list.push(toSession(b, q, `bank:${q.id}`));
    }
    if (pool === MINE || pool === ALL) {
      for (const c of custom) list.push(toSession(null, c, `custom:${c.id}`));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, usableBanks, bankQuestions, custom]);

  useEffect(() => {
    setSelected(new Set());
    setSingle("");
  }, [pool]);

  const sim = simulations.find((b) => b.id === simId) || null;
  const simCount = sim ? blueprintAvailable(sim, bankQuestions) : 0;
  const simTime = sim ? blueprintSeconds(sim.blueprint) : 0;

  const withTiming = (qs: SessionQuestion[]) =>
    qs.map((q) => ({
      ...q,
      prep: prep === DEFAULT ? q.prep : Number(prep),
      response: response === DEFAULT ? q.response : Number(response),
    }));

  const practiceChosen: SessionQuestion[] =
    pick === "single"
      ? poolQuestions.filter((q) => q.key === single)
      : pick === "multiple"
        ? poolQuestions.filter((q) => selected.has(q.key))
        : poolQuestions.slice(0, Math.min(randomCount, poolQuestions.length));
  const practiceCount = pick === "random" ? Math.min(randomCount, poolQuestions.length) : practiceChosen.length;
  const practiceTime = withTiming(practiceChosen).reduce((s, q) => s + q.prep + q.response, 0);

  const start = () => {
    if (mode === "simulation") {
      if (!sim) return;
      const drawn = drawFromBlueprint(sim, bankQuestions, recentQuestionKeys());
      if (!drawn.length) return;
      rememberQuestions(drawn.map((q) => q.key));
      onStart(drawn, { school: sim.school || "", program: sim.program || "", retakes: sim.sim_retakes, shuffle: false }, [], {
        mode: "simulation",
        title: [sim.school, sim.program].filter(Boolean).join(" · ") || sim.title,
      });
      return;
    }
    let qs: SessionQuestion[];
    if (pick === "random") {
      qs = drawRandom(poolQuestions, randomCount, recentQuestionKeys());
      rememberQuestions(qs.map((q) => q.key));
    } else {
      qs = practiceChosen;
    }
    if (!qs.length) {
      toast.error(t("mi.selectAtLeastOne"));
      return;
    }
    onStart(withTiming(qs), { school, program, retakes, shuffle: false }, qs.map((q) => q.key), {
      mode: "practice",
      title: pool === ALL ? "" : pool === MINE ? t("mi.tabMine") : poolTitle[pool] || "",
    });
  };

  const handleAdd = async () => {
    if (!bulk.fresh.length) return;
    try {
      await add.mutateAsync(
        bulk.fresh.map((title) => {
          const m = bulk.meta[title] ?? {};
          return { title, question_type: m.type ?? newType, preparation_time: m.prep ?? 30, response_time: m.response ?? 60 };
        }),
      );
      toast.success(bulk.fresh.length > 1 ? t("mi3.addedN", { n: bulk.fresh.length }) : t("mi.added"));
      bulk.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const loading = banksLoading || questionsLoading;
  const canStart = mode === "simulation" ? !!sim && simCount > 0 : practiceCount > 0;
  const summary =
    mode === "simulation"
      ? sim ? t("mi2.summarySim", { n: simCount, time: formatSeconds(simTime) }) : ""
      : t("mi.selectedSummary", { count: practiceCount, time: pick === "random" ? "—" : formatSeconds(practiceTime) });

  const fill = (text: string) => fillPlaceholders(text, school, program);

  return (
    <div className="pb-28">
      <header className="max-w-3xl">
        <h1 className="font-serif text-3xl font-bold text-pine sm:text-4xl">{t("mi.title")}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t("mi2.subtitle")}</p>
      </header>

      {/* Mode switch */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("mi2.mode")}>
        {(["simulation", "practice"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            disabled={m === "simulation" && simulations.length === 0}
            className={cn(
              "rounded-md border bg-card p-4 text-left transition-colors disabled:opacity-50",
              mode === m ? "border-primary ring-1 ring-primary" : "hover:border-primary/50",
            )}
          >
            <span className="flex items-center gap-2 font-semibold text-pine">
              {m === "simulation" ? <GraduationCap className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              {t(m === "simulation" ? "mi2.simulation" : "mi2.practice")}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {t(m === "simulation" ? "mi2.simulationHint" : "mi2.practiceHint")}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Loader2 className="mt-8 h-5 w-5 animate-spin text-muted-foreground" />
      ) : mode === "simulation" ? (
        /* ---------------- Full simulation ---------------- */
        <section className="mt-8" aria-labelledby="sim-heading">
          <h2 id="sim-heading" className="font-semibold text-pine">{t("mi2.chooseProgram")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {simulations.map((b) => {
              const n = blueprintAvailable(b, bankQuestions);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSimId(b.id)}
                  aria-pressed={simId === b.id}
                  className={cn(
                    "rounded-md border bg-card p-4 text-left transition-colors",
                    simId === b.id ? "border-primary ring-1 ring-primary" : "hover:border-primary/50",
                  )}
                >
                  <span className="block font-semibold">{b.school || b.title}</span>
                  {b.program && <span className="block text-sm">{b.program}</span>}
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {t("mi2.nQuestions", { n })} · {t("mi3.about", { time: formatSeconds(blueprintSeconds(b.blueprint)) })} ·{" "}
                    {b.sim_retakes === 0 ? t("mi.retakes0") : b.sim_retakes === 1 ? t("mi.retakes1") : t("mi.retakes2")}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {b.blueprint.map((sec, i) => (
                      <span key={i} className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {poolTitle[sec.pool_id] ?? "?"} ×{sec.count} · {formatSeconds(sec.prep)}/{formatSeconds(sec.response)}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          {sim?.description && <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{sim.description}</p>}
          <p className="mt-4 text-sm text-muted-foreground">{t("mi3.simDraw")} {t("mi2.simRules")}</p>
        </section>
      ) : (
        /* ---------------- Practice ---------------- */
        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="h-fit space-y-5 rounded-md border bg-card p-5">
            <h2 className="font-semibold text-pine">{t("mi.settings")}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("mi.prep")}</Label>
                <Select value={prep} onValueChange={setPrep}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT}>{t("mi2.defaultTime")}</SelectItem>
                    {PREP_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>{formatSeconds(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("mi.response")}</Label>
                <Select value={response} onValueChange={setResponse}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT}>{t("mi2.defaultTime")}</SelectItem>
                    {RESPONSE_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>{formatSeconds(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("mi.retakes")}</Label>
              <Select value={String(retakes)} onValueChange={(v) => setRetakes(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("mi.retakes0")}</SelectItem>
                  <SelectItem value="1">{t("mi.retakes1")}</SelectItem>
                  <SelectItem value="2">{t("mi.retakes2")}</SelectItem>
                  <SelectItem value="99">{t("mi.retakesUnlimited")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-school">{t("mi.school")}</Label>
              <Input id="mi-school" value={school} onChange={(e) => setSchool(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-program">{t("mi.program")}</Label>
              <Input id="mi-program" value={program} onChange={(e) => setProgram(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">{t("mi.placeholderHint")}</p>
          </aside>

          <section className="space-y-5 rounded-md border bg-card p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1 space-y-1.5">
                <Label>{t("mi2.pool")}</Label>
                <Select value={pool} onValueChange={setPool}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t("mi2.allBanks")}</SelectItem>
                    {usableBanks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.title} ({bankQuestions[b.id]?.length ?? 0})</SelectItem>
                    ))}
                    <SelectItem value={MINE}>{t("mi.tabMine")} ({custom.length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex rounded-md border p-0.5" role="radiogroup" aria-label={t("mi2.pickMethod")}>
                {(["single", "multiple", "random"] as Pick[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={pick === p}
                    onClick={() => setPick(p)}
                    className={cn("rounded px-3 py-1.5 text-sm", pick === p ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  >
                    {t(`mi2.pick.${p}` as never)}
                  </button>
                ))}
              </div>
            </div>

            {pick === "random" ? (
              <div className="rounded-md bg-muted/40 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Shuffle className="h-4 w-4 text-primary" />
                  <Label htmlFor="mi-random">{t("mi2.randomCount")}</Label>
                  <Input
                    id="mi-random"
                    type="number"
                    min={1}
                    max={Math.max(1, poolQuestions.length)}
                    value={randomCount}
                    onChange={(e) => setRandomCount(Math.max(1, Math.min(Number(e.target.value) || 1, Math.max(1, poolQuestions.length))))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">{t("mi2.randomOf", { n: poolQuestions.length })}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t("mi2.randomHint")}</p>
              </div>
            ) : poolQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{pool === MINE ? t("mi.mineEmpty") : t("mi.noBanks")}</p>
            ) : (
              <>
                {pick === "multiple" && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelected(new Set(poolQuestions.map((q) => q.key)))}>{t("mi.selectAll")}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>{t("mi.clearAll")}</Button>
                  </div>
                )}
                <ul className="max-h-[28rem] divide-y overflow-y-auto rounded-md border">
                  {poolQuestions.map((q) => {
                    const isCustom = q.key.startsWith("custom:");
                    const on = pick === "single" ? single === q.key : selected.has(q.key);
                    return (
                      <li key={q.key} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40">
                        {pick === "single" ? (
                          <input
                            type="radio"
                            name="mi-single"
                            className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
                            checked={on}
                            onChange={() => setSingle(q.key)}
                            aria-label={q.text}
                          />
                        ) : (
                          <Checkbox
                            className="mt-0.5"
                            checked={on}
                            aria-label={q.text}
                            onCheckedChange={(v) =>
                              setSelected((prev) => {
                                const next = new Set(prev);
                                if (v === true) next.add(q.key);
                                else next.delete(q.key);
                                return next;
                              })
                            }
                          />
                        )}
                        <span className="flex-1">
                          <span className="block leading-snug">{fill(q.text)}</span>
                          <span className="text-xs text-muted-foreground">
                            {q.type === "written" ? t("mi.written") : t("mi.video")} · {t("mi.prep")} {formatSeconds(prep === DEFAULT ? q.prep : Number(prep))} · {t("mi.response")}{" "}
                            {formatSeconds(response === DEFAULT ? q.response : Number(response))}
                            {isCustom && ` · ${t("mi2.mine")}`}
                          </span>
                        </span>
                        {isCustom && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={t("mi.delete")}
                            onClick={() => void remove.mutateAsync(q.key.slice(7)).then(() => toast.success(t("mi.deleted")))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <div className="space-y-2 rounded-md bg-muted/40 p-4">
              <Label htmlFor="mi-new">{t("mi.newQuestion")}</Label>
              <p className="text-xs text-muted-foreground">{t("mi3.mineHint")}</p>
              <BulkQuestionInput id="mi-new" bulk={bulk} rows={3} placeholder={t("mi.newQuestionPlaceholder")} />
              <div className="flex flex-wrap items-center gap-2">
                <Select value={newType} onValueChange={(v) => setNewType(v as QuestionType)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">{t("mi.video")}</SelectItem>
                    <SelectItem value="written">{t("mi.written")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAdd} disabled={!bulk.fresh.length || add.isPending}>
                  {add.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
                  {bulk.fresh.length > 1 ? t("mi3.addN", { n: bulk.fresh.length }) : t("mi.add")}
                </Button>
                <span className="text-xs text-muted-foreground">{t("mi.mineVisibility")}</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Sticky summary bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm text-muted-foreground">{summary}</span>
          <Button size="lg" onClick={start} disabled={!canStart}>
            {mode === "simulation" ? t("mi2.startSim") : t("mi.start")}
          </Button>
        </div>
      </div>
    </div>
  );
}
