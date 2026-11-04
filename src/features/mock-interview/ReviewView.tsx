import { useState } from "react";
import { Download } from "lucide-react";
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
  const base = (settings.school || "mock-interview").replace(/[^\w一-鿿-]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "mock-interview"}-Q${n}.${ext}`;
}

export default function ReviewView({ answers, settings, onAgain, onBackToSetup }: Props) {
  const { t } = useLanguage();
  // Self-assessment stays in this page only; nothing is saved or sent.
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  return (
    <div className="pb-16">
      <header className="max-w-3xl">
        <h1 className="font-serif text-3xl font-bold text-pine">{t("mi.reviewTitle")}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t("mi.reviewBody")}</p>
      </header>

      <ol className="mt-8 space-y-6">
        {answers.map((a, i) => (
          <li key={a.question.key} className="rounded-md border bg-card">
            <div className="border-b p-5">
              <div className="text-sm text-muted-foreground">
                {t("mi.questionOf", { n: i + 1, total: answers.length })} ·{" "}
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
                      <a href={a.videoUrl} download={fileName(settings, i + 1, a.videoMime)}>
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
        <Button onClick={onAgain}>{t("mi.practiceAgain")}</Button>
        <Button variant="outline" onClick={onBackToSetup}>{t("mi.backToSetup")}</Button>
      </div>
    </div>
  );
}
