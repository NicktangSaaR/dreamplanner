import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";

/**
 * Step-by-step page guides. Each step points at an element marked with
 * `data-tour="<target>"` (or none, for a centred welcome card), highlights it
 * and explains it. Steps whose element isn't on the page are skipped.
 */
export type TourStep = {
  target?: string;
  zh: { title: string; body: string };
  en: { title: string; body: string };
};

const seenKey = (name: string, userId?: string | null) => `dreamplanner.guide.${name}.${userId || "anon"}`;

function readSeen(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function writeSeen(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* not remembered; the guide may show again next visit */
  }
}

/**
 * A page guide that opens by itself the first time someone visits the page
 * (once nothing else, such as a dialog, is open) and can be replayed.
 */
export function useGuide(name: string, userId: string | null | undefined, opts: { auto?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const key = seenKey(name, userId);
  const auto = opts.auto ?? true;

  useEffect(() => {
    if (!auto || userId === undefined || readSeen(key)) return;
    // wait until the page has settled and no dialog is open
    let tries = 0;
    const id = window.setInterval(() => {
      tries++;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      if (tries < 3) return; // let the page render first (≈1.5 s)
      window.clearInterval(id);
      setOpen(true);
    }, 500);
    return () => window.clearInterval(id);
  }, [auto, key, userId]);

  const close = useCallback(() => {
    writeSeen(key);
    setOpen(false);
  }, [key]);
  return { open, start: () => setOpen(true), close };
}

type Box = { top: number; left: number; width: number; height: number };
const PAD = 6;

export function Tour({ steps, open, onClose }: { steps: TourStep[]; open: boolean; onClose: () => void }) {
  const { lang } = useLanguage();
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [vw, setVw] = useState(() => window.innerWidth);
  const [vh, setVh] = useState(() => window.innerHeight);

  // steps whose element is on the page right now
  const [live, setLive] = useState<TourStep[]>([]);
  useEffect(() => {
    if (!open) return;
    const visible = (t: string) => {
      const el = document.querySelector(`[data-tour="${t}"]`);
      return !!el && el.getClientRects().length > 0; // present and not display:none
    };
    setLive(steps.filter((s) => !s.target || visible(s.target)));
    setI(0);
  }, [open, steps]);

  const step = live[i];
  const measure = useCallback(() => {
    setVw(window.innerWidth);
    setVh(window.innerHeight);
    const el = step?.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
    if (!el) return setBox(null);
    const r = el.getBoundingClientRect();
    setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step]);

  useLayoutEffect(() => {
    if (!open || !step) return;
    const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    measure();
    const t = window.setTimeout(measure, 400); // after the smooth scroll
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, measure]);

  const next = useCallback(() => (i + 1 < live.length ? setI(i + 1) : onClose()), [i, live.length, onClose]);
  const back = () => setI(Math.max(0, i - 1));
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, onClose]);

  if (!open || !step) return null;
  const text = lang === "zh" ? step.zh : step.en;
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);

  // Card position: under the highlight if there's room, else above; centred when there's no target.
  const W = Math.min(360, vw - 32);
  const mobile = vw < 640;
  let card: React.CSSProperties;
  if (!box) card = { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: Math.min(420, vw - 32) };
  else if (mobile) card = { left: 16, right: 16, bottom: 16 };
  else {
    const below = box.top + box.height + 12;
    const top = below + 220 < vh ? below : Math.max(16, box.top - 12 - 220);
    const left = Math.min(Math.max(16, box.left), vw - W - 16);
    card = { top, left, width: W };
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" aria-live="polite">
      {/* dim everything except the highlighted element; clicks don't reach the page */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
      {box ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-brass transition-all duration-200"
          style={{ ...box, boxShadow: "0 0 0 9999px rgba(15, 30, 26, 0.55)" }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[rgba(15,30,26,0.55)]" />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={text.title}
        className="absolute rounded-lg border bg-card p-5 shadow-xl"
        style={card}
      >
        <button type="button" onClick={onClose} aria-label={L("关闭指南", "Close guide")}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <p className="text-xs font-medium text-brass">{L(`第 ${i + 1} / ${live.length} 步`, `Step ${i + 1} of ${live.length}`)}</p>
        <h3 className="mt-1 pr-6 font-serif text-lg font-semibold text-pine">{text.title}</h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{text.body}</p>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={onClose} className="mr-auto text-sm text-muted-foreground hover:text-foreground">
            {L("跳过", "Skip")}
          </button>
          {i > 0 && <Button variant="outline" size="sm" onClick={back}>{L("上一步", "Back")}</Button>}
          <Button size="sm" onClick={next} autoFocus>
            {i + 1 < live.length ? L("下一步", "Next") : L("开始使用", "Got it")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** "Guide" button to replay a page's guide. */
export function GuideButton({ onClick, className }: { onClick: () => void; className?: string }) {
  const { lang } = useLanguage();
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className={className} data-tour="guide-button">
      <HelpCircle className="mr-1.5 h-4 w-4" />
      {lang === "zh" ? "使用指南" : "Guide"}
    </Button>
  );
}
