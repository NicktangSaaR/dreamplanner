import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { readAloud } from "./readAloud";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fillPlaceholders, formatSeconds, type Answer, type SessionQuestion, type SessionSettings } from "./types";

/** "reading": the question is read aloud twice; prep time starts after. */
type Phase = "check" | "reading" | "prep" | "answer" | "done";
type CameraState = "pending" | "ready" | "denied" | "missing" | "busy" | "unsupported" | "skipped";

interface Props {
  questions: SessionQuestion[];
  settings: SessionSettings;
  onFinish: (answers: Answer[]) => void;
  onExit: (answers: Answer[]) => void;
  /** Called after each answer, so the session record stays current if the tab is closed. */
  onProgress?: (answers: Answer[]) => void;
}

const MIME_CANDIDATES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
}

function cameraErrorState(e: unknown): CameraState {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "missing";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "denied";
}

/** Circular countdown. */
function Ring({ remaining, total, tone }: { remaining: number; total: number; tone: "prep" | "rec" | "idle" }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="40" cy="40" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          className={cn("transition-[stroke-dashoffset] duration-200", tone === "rec" ? "stroke-red-600" : tone === "prep" ? "stroke-brass" : "stroke-primary")}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-semibold tabular-nums">
        {formatSeconds(remaining)}
      </span>
    </div>
  );
}

export default function InterviewRunner({ questions, settings, onFinish, onExit, onProgress }: Props) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("check");
  const [camera, setCamera] = useState<CameraState>("pending");
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [attempts, setAttempts] = useState(0);
  const [written, setWritten] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [reading, setReading] = useState(1);
  /** Combined clock: when the question's time began, and the length of the current answer. */
  const windowStart = useRef(0);
  const [answerTotal, setAnswerTotal] = useState(0);
  const stopReading = useRef<() => void>(() => {});

  const streamRef = useRef<MediaStream | null>(null);
  const liveRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const answersRef = useRef<Answer[]>([]);
  answersRef.current = answers;
  useEffect(() => {
    if (answers.length) onProgress?.(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const question = questions[index];
  // Follow-ups belong to their question: count main questions only.
  const mainTotal = questions.filter((q) => !q.followUp).length;
  const mainNo = questions.slice(0, index + 1).filter((q) => !q.followUp).length;
  const isWritten = question?.type === "written";
  const retakesLeft = settings.retakes >= 99 ? 99 : Math.max(0, settings.retakes - (attempts - 1));

  // ------------------------------------------------------------ camera ---
  const connectCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setCamera("unsupported");
      return;
    }
    setCamera("pending");
    try {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      setCamera("ready");
    } catch (e) {
      setCamera(cameraErrorState(e));
    }
  }, []);

  useEffect(() => {
    connectCamera();
    return () => {
      stopReading.current();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, [connectCamera]);

  // Attach the live stream whenever the preview element is shown.
  useEffect(() => {
    if (liveRef.current && streamRef.current && camera === "ready") {
      liveRef.current.srcObject = streamRef.current;
    }
  }, [camera, phase, playbackUrl]);

  // Warn before leaving while recordings exist only in memory.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (answersRef.current.some((a) => a.videoUrl)) {
        e.preventDefault();
        e.returnValue = t("mi.leaveWarning");
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [t]);

  // ------------------------------------------------------------- timer ---
  useEffect(() => {
    if (endsAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const remaining = endsAt === null ? 0 : Math.max(0, (endsAt - now) / 1000);

  // -------------------------------------------------------- recording ---
  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream || camera !== "ready") return;
    const mimeType = pickMime();
    chunksRef.current = [];
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    rec.ondataavailable = (ev) => ev.data.size && chunksRef.current.push(ev.data);
    rec.start(1000);
    recorderRef.current = rec;
  };

  const stopRecording = (): Promise<{ url: string; mime: string } | null> =>
    new Promise((resolve) => {
      const rec = recorderRef.current;
      if (!rec || rec.state === "inactive") return resolve(null);
      rec.onstop = () => {
        const mime = rec.mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        resolve({ url: URL.createObjectURL(blob), mime });
      };
      rec.stop();
    });

  // ------------------------------------------------------------ phases ---
  /** Prep countdown, once the question has been read. */
  const startPrep = () => {
    stopReading.current();
    windowStart.current = Date.now();
    // combined clock: thinking may use at most `prep` of the total
    const think = question.combined ? Math.min(question.prep, question.response) : question.prep;
    if (think > 0) {
      setPhase("prep");
      setNow(Date.now()); // the clock doesn't tick while the question is read
      setEndsAt(Date.now() + think * 1000);
    } else {
      beginAnswer();
    }
  };

  /** New question: read it aloud twice, then start the prep countdown. */
  const beginPrep = useCallback(() => {
    setPlaybackUrl(null);
    setWritten("");
    setAttempts(0);
    setEndsAt(null);
    setPhase("reading");
    setReading(1);
    stopReading.current = readAloud(fillPlaceholders(question.text, settings.school, settings.program), {
      times: 2,
      onRead: setReading,
      onDone: startPrep,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  const beginAnswer = () => {
    stopReading.current();
    setPlaybackUrl(null);
    setAttempts((a) => a + 1);
    // combined clock: answering gets whatever is left of the total (a retake gets the full total)
    const end = question.combined && phase === "prep"
      ? windowStart.current + question.response * 1000
      : Date.now() + question.response * 1000;
    setAnswerTotal(Math.max(1, Math.round((end - Date.now()) / 1000)));
    setPhase("answer");
    setNow(Date.now());
    setEndsAt(end);
    if (!isWritten) startRecording();
  };

  const finishAnswer = async () => {
    setEndsAt(null);
    const rec = isWritten ? null : await stopRecording();
    setAnswers((prev) => {
      const others = prev.filter((a) => a.question.key !== question.key);
      const old = prev.find((a) => a.question.key === question.key);
      if (old?.videoUrl && rec) URL.revokeObjectURL(old.videoUrl);
      return [
        ...others,
        {
          question,
          videoUrl: rec?.url ?? old?.videoUrl,
          videoMime: rec?.mime ?? old?.videoMime,
          written: isWritten ? written : undefined,
          attemptsUsed: attempts,
        },
      ];
    });
    if (rec) setPlaybackUrl(rec.url);
    setPhase("done");
  };

  // Auto-advance when a countdown runs out.
  useEffect(() => {
    if (endsAt === null || remaining > 0) return;
    if (phase === "prep") beginAnswer();
    else if (phase === "answer") finishAnswer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, endsAt, phase]);

  const goNext = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPhase("check"); // transient; the effect below starts prep for the new question
    } else {
      onFinish([...answersRef.current].sort(
        (a, b) => questions.findIndex((q) => q.key === a.question.key) - questions.findIndex((q) => q.key === b.question.key),
      ));
    }
  };

  // Start prep automatically for every question after the first.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (started && phase === "check") beginPrep();
  }, [started, phase, index, beginPrep]);

  const handleExit = () => {
    if (window.confirm(t("mi.exitConfirm"))) {
      stopReading.current();
      const done = [...answersRef.current];
      done.forEach((a) => a.videoUrl && URL.revokeObjectURL(a.videoUrl));
      onExit(done);
    }
  };

  const cameraMessage: Record<Exclude<CameraState, "pending" | "ready" | "skipped">, string> = {
    denied: t("mi.cameraDenied"),
    missing: t("mi.cameraMissing"),
    busy: t("mi.cameraBusy"),
    unsupported: t("mi.cameraUnsupported"),
  };
  const cameraProblem = camera !== "pending" && camera !== "ready" && camera !== "skipped";
  const text = fillPlaceholders(question.text, settings.school, settings.program);
  const phaseLabel =
    phase === "reading" ? t("mi.reading", { n: reading })
    : phase === "prep" ? (question.combined ? t("mi.thinking", { total: formatSeconds(question.response) }) : t("mi.preparing"))
    : phase === "answer" ? (isWritten ? t("mi.writing") : t("mi.recording"))
    : phase === "done" ? t("mi.answered") : t("mi.cameraCheck");
  const ringTotal = phase === "prep" ? (question.combined ? Math.min(question.prep, question.response) : question.prep) : answerTotal || question.response;
  const wordCount = written.trim() ? written.trim().split(/\s+/).length : 0;

  return (
    <div className="pb-12">
      {/* Top bar: school, progress, exit */}
      <div className="flex flex-wrap items-center gap-4 border-b pb-4">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-pine">{settings.school || t("mi.title")}</div>
          {settings.program && <div className="truncate text-sm text-muted-foreground">{settings.program}</div>}
        </div>
        <div className="flex items-center gap-1.5" aria-label={t("mi.questionOf", { n: mainNo, total: mainTotal })}>
          {questions.map((q, i) => (
            <span
              key={q.key}
              className={cn(
                "h-2 rounded-full",
                q.followUp ? "w-2.5" : "w-6", // follow-ups: short marks after their question
                i < index ? "bg-primary" : i === index ? "bg-brass" : "bg-muted",
              )}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleExit}>{t("mi.exit")}</Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* Question panel */}
        <section className="rounded-md border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            {t("mi.questionOf", { n: mainNo, total: mainTotal })} ·{" "}
            {question.followUp && <span className="text-brass">{t("mi.followUpOf", { n: question.followUp.n, total: question.followUp.total })} · </span>}
            {isWritten ? t("mi.written") : t("mi.video")}
          </div>
          {question.followUp && (phase !== "check" || started) && (
            <p className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {t("mi.followUpContext")}{question.followUp.of}
            </p>
          )}
          {phase === "check" && !started ? (
            <>
              <h2 className="mt-3 font-serif text-2xl font-semibold text-pine">{t("mi.cameraCheck")}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{t("mi.cameraCheckBody")}</p>
            </>
          ) : (
            (() => {
              // "Do you agree or disagree with the following statement: …" — the statement on its own line
              const m = text.match(/^(.*?following statement\s*[:：])\s*(.+)$/is);
              return m ? (
                <>
                  <p className="mt-3 text-base text-muted-foreground">{m[1]}</p>
                  <blockquote className="mt-3 border-l-4 border-brass pl-4 font-serif text-xl leading-relaxed text-foreground sm:text-2xl">{m[2]}</blockquote>
                </>
              ) : (
                <p className="mt-3 font-serif text-xl leading-relaxed text-foreground sm:text-2xl">{text}</p>
              );
            })()
          )}
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <dt className="text-muted-foreground">{question.combined ? t("mi.totalTime") : t("mi.prep")}</dt>
              <dd className="font-mono font-semibold">{formatSeconds(question.combined ? question.response : question.prep)}</dd>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <dt className="text-muted-foreground">{question.combined ? t("mi.maxThinking") : t("mi.response")}</dt>
              <dd className="font-mono font-semibold">{formatSeconds(question.combined ? Math.min(question.prep, question.response) : question.response)}</dd>
            </div>
          </dl>
          {question.combined && <p className="mt-2 text-xs text-muted-foreground">{t("mi.combinedHint")}</p>}
        </section>

        {/* Stage */}
        <section className="overflow-hidden rounded-md border bg-card">
          {isWritten && phase === "answer" ? (
            <div className="p-4">
              <Textarea
                autoFocus
                rows={12}
                value={written}
                onChange={(e) => setWritten(e.target.value)}
                placeholder={t("mi.typeAnswer")}
                className="resize-none text-base"
              />
              <div className="mt-2 text-right text-xs text-muted-foreground">{t("mi.words", { n: wordCount })}</div>
            </div>
          ) : (
            <div className="relative aspect-video bg-[#0d1419]">
              {playbackUrl ? (
                <video key={playbackUrl} src={playbackUrl} controls playsInline className="h-full w-full object-contain" />
              ) : camera === "ready" ? (
                <video ref={liveRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/80">
                  {camera === "pending" ? "…" : camera === "skipped" ? t("mi.noRecordingNote") : cameraMessage[camera as keyof typeof cameraMessage]}
                </div>
              )}
              {phase === "answer" && !isWritten && camera === "ready" && (
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> REC
                </span>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 border-t p-4">
            {(phase === "prep" || phase === "answer") && (
              <Ring remaining={remaining} total={ringTotal} tone={phase === "prep" ? "prep" : "rec"} />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-semibold">
                {phase === "reading" && <Volume2 className="h-4 w-4 animate-pulse text-brass" aria-hidden />}
                {phaseLabel}
              </div>
              {phase === "reading" && <div className="text-xs text-muted-foreground">{t("mi.readingHint")}</div>}
            </div>
            <div className="flex flex-wrap gap-2">
              {phase === "check" && !started && (
                <>
                  {cameraProblem && camera !== "unsupported" && (
                    <Button variant="outline" onClick={connectCamera}>{t("mi.retryCamera")}</Button>
                  )}
                  {cameraProblem && (
                    <Button variant="ghost" onClick={() => setCamera("skipped")}>{t("mi.continueWithoutCamera")}</Button>
                  )}
                  <Button onClick={() => setStarted(true)} disabled={camera === "pending" || cameraProblem}>
                    {t("mi.begin")}
                  </Button>
                </>
              )}
              {phase === "reading" && <Button variant="outline" onClick={startPrep}>{t("mi.skipReading")}</Button>}
              {phase === "prep" && <Button onClick={beginAnswer}>{t("mi.startNow")}</Button>}
              {phase === "answer" && <Button onClick={finishAnswer}>{t("mi.finish")}</Button>}
              {phase === "done" && (
                <>
                  {retakesLeft > 0 && (
                    <Button variant="outline" onClick={beginAnswer}>
                      {settings.retakes >= 99 ? t("mi.retake", { n: "∞" }) : t("mi.retake", { n: retakesLeft })}
                    </Button>
                  )}
                  <Button onClick={goNext}>
                    {index + 1 < questions.length ? (questions[index + 1].followUp ? t("mi.nextFollowUp") : t("mi.next")) : t("mi.finishInterview")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
