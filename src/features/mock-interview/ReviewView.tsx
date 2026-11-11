import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, FolderDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MessageKey } from "@/i18n/translations";
import { fillPlaceholders, type Answer, type SessionSettings } from "./types";

interface Props {
  answers: Answer[];
  settings: SessionSettings;
  onAgain: () => void;
  onBackToSetup: () => void;
}

const CHECKS: MessageKey[] = ["mi.checkStructure", "mi.checkSpecific", "mi.checkTime", "mi.checkDelivery"];

function fileName(settings: SessionSettings, n: number, mime?: string) {
  const ext = mime?.includes("mp4") ? "mp4" : "webm";
  return `${safeBase(settings)}-Q${n}.${ext}`;
}

function safeBase(settings: SessionSettings) {
  const base = [settings.school, settings.program].filter(Boolean).join("-") || "mock-interview";
  return base.replace(/[^\w一-鿿-]+/g, "-").replace(/^-|-$/g, "") || "mock-interview";
}

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export default function ReviewView({ answers, settings, onAgain, onBackToSetup }: Props) {
  const { t } = useLanguage();
  // Self-assessment stays in this page only; nothing is saved or sent.
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [zipping, setZipping] = useState(false);

  const videoIdx = answers.flatMap((a, i) => (a.videoUrl ? [i] : []));
  const unsaved = videoIdx.some((i) => !saved.has(i));
  const markSaved = (idx: number[]) => setSaved((prev) => new Set([...prev, ...idx]));

  // Recordings live only in this tab: warn before the tab is closed or reloaded.
  useEffect(() => {
    if (!unsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = t("mi.leaveWarning");
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [unsaved, t]);

  const confirmLeave = (go: () => void) => () => {
    if (unsaved && !window.confirm(t("mi4.leaveReview"))) return;
    go();
  };

  /** One zip with every recording plus a text record of questions, written answers and notes. */
  const downloadAll = async () => {
    setZipping(true);
    try {
      const { zip } = await import("fflate");
      const enc = new TextEncoder();
      const files: Record<string, [Uint8Array, { level: 0 }]> = {};
      for (const i of videoIdx) {
        const a = answers[i];
        const buf = new Uint8Array(await (await fetch(a.videoUrl!)).arrayBuffer());
        files[fileName(settings, i + 1, a.videoMime)] = [buf, { level: 0 }];
      }
      const lines = [
        `${t("mi4.recordTitle")} · ${[settings.school, settings.program].filter(Boolean).join(" · ") || "—"}`,
        new Date().toLocaleString(),
        "",
        ...answers.flatMap((a, i) => {
          const qKey = a.question.key;
          const done = CHECKS.filter((k) => checks[`${qKey}|${k}`]).map((k) => `✓ ${t(k)}`);
          return [
            `Q${i + 1} (${a.question.type === "written" ? t("mi.written") : t("mi.video")})`,
            fillPlaceholders(a.question.text, settings.school, settings.program),
            a.question.type === "written"
              ? `${t("mi4.answer")}:\n${a.written?.trim() || "—"}`
              : a.videoUrl ? `${t("mi4.video")}: ${fileName(settings, i + 1, a.videoMime)}` : t("mi.noRecordingNote"),
            ...done,
            ...(notes[qKey]?.trim() ? [`${t("mi.notes")}: ${notes[qKey].trim()}`] : []),
            "",
          ];
        }),
      ];
      files[`${t("mi4.recordFile")}.txt`] = [enc.encode("\uFEFF" + lines.join("\r\n")), { level: 0 }];
      const data = await new Promise<Uint8Array>((res, rej) => zip(files, (err, out) => (err ? rej(err) : res(out))));
      const url = URL.createObjectURL(new Blob([data], { type: "application/zip" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeBase(settings)}-${stamp()}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      markSaved(videoIdx);
    } catch {
      toast.error(t("mi4.zipFailed"));
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="pb-16">
      <header className="max-w-3xl">
        <h1 className="font-serif text-3xl font-bold text-pine">{t("mi.reviewTitle")}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t("mi.reviewBody")}</p>
        {videoIdx.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-primary/30 bg-primary/5 p-4">
            <Button onClick={downloadAll} disabled={zipping}>
              {zipping ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FolderDown className="mr-1.5 h-4 w-4" />}
              {t("mi4.downloadAll")}
            </Button>
            <p className="min-w-0 flex-1 text-sm text-muted-foreground">
              {unsaved ? t("mi4.downloadAllHint") : t("mi4.allSaved")}
            </p>
          </div>
        )}
      </header>

      <ol className="mt-8 space-y-6">
        {answers.map((a, i) => (
          <li key={a.question.key} className="rounded-md border bg-card">
            <div className="border-b p-5">
              <div className="text-sm text-muted-foreground">
                {t("mi.questionOf", { n: answers.slice(0, i + 1).filter((x) => !x.question.followUp).length, total: answers.filter((x) => !x.question.followUp).length })} ·{" "}
                {a.question.followUp && <span className="text-brass">{t("mi.followUpOf", { n: a.question.followUp.n, total: a.question.followUp.total })} · </span>}
                {a.question.type === "written" ? t("mi.written") : t("mi.video")}
              </div>
              <p className="mt-2 font-serif text-lg leading-relaxed">
                {fillPlaceholders(a.question.text, settings.school, settings.program)}
              </p>
            </div>
            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div>
                {a.question.type === "written" ? (
                  <div className="whitespace-pre-wrap rounded-md bg-muted/50 p-4 text-sm leading-relaxed">
                    {a.written?.trim() || "—"}
                  </div>
                ) : a.videoUrl ? (
                  <>
                    <video src={a.videoUrl} controls playsInline className="aspect-video w-full rounded-md bg-black" />
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <a href={a.videoUrl} download={fileName(settings, i + 1, a.videoMime)} onClick={() => markSaved([i])}>
                        <Download className="mr-1.5 h-4 w-4" /> {t("mi.download")}
                      </a>
                    </Button>
                  </>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-md bg-muted/50 text-sm text-muted-foreground">
                    {t("mi.noRecordingNote")}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {CHECKS.map((key) => {
                  const id = `${a.question.key}|${key}`;
                  return (
                    <label key={key} className="flex items-start gap-2 text-sm">
                      <Checkbox
                        className="mt-0.5"
                        checked={!!checks[id]}
                        onCheckedChange={(v) => setChecks((c) => ({ ...c, [id]: v === true }))}
                      />
                      {t(key)}
                    </label>
                  );
                })}
                <Textarea
                  rows={4}
                  aria-label={t("mi.notes")}
                  placeholder={t("mi.notesPlaceholder")}
                  value={notes[a.question.key] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [a.question.key]: e.target.value }))}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={confirmLeave(onAgain)}>{t("mi.practiceAgain")}</Button>
        <Button variant="outline" onClick={confirmLeave(onBackToSetup)}>{t("mi.backToSetup")}</Button>
      </div>
    </div>
  );
}
