/**
 * Read a question aloud with the browser's speech synthesis, `times` times
 * with a short pause in between, like a real recorded interview.
 *
 * Calls `onRead(n)` as reading n starts and `onDone()` once when all readings
 * have finished (or straight away when the browser can't speak). Returns a
 * function that stops reading without calling `onDone`.
 */
export function readAloud(text: string, opts: { times?: number; onRead?: (n: number) => void; onDone: () => void }): () => void {
  const times = opts.times ?? 2;
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth || typeof SpeechSynthesisUtterance === "undefined" || !text.trim()) {
    opts.onDone();
    return () => {};
  }

  const zh = /[一-鿿]/.test(text);
  const lang = zh ? "zh-CN" : "en-US";
  const pickVoice = () => {
    const voices = synth.getVoices();
    return voices.find((v) => v.lang === lang && /Google|Samantha|Microsoft|Natural/i.test(v.name))
      ?? voices.find((v) => v.lang === lang)
      ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
  };

  let stopped = false;
  let finished = false;
  let pause: number | undefined;
  const done = () => {
    if (stopped || finished) return;
    finished = true;
    window.clearTimeout(pause);
    window.clearTimeout(watchdog);
    opts.onDone();
  };

  // Some browsers never fire `end`; never leave the student waiting forever.
  const units = zh ? text.replace(/\s/g, "").length / 4 : text.split(/\s+/).length / 2.3; // seconds per reading
  const watchdog = window.setTimeout(done, (units * times + times * 1.5 + 4) * 1000);

  const speak = (n: number) => {
    if (stopped || finished) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.95;
    const v = pickVoice();
    if (v) u.voice = v;
    u.onstart = () => opts.onRead?.(n);
    u.onend = () => {
      if (n < times) pause = window.setTimeout(() => speak(n + 1), 1200);
      else done();
    };
    u.onerror = (e) => {
      // "interrupted"/"canceled" come from our own stop()
      if (e.error !== "interrupted" && e.error !== "canceled") done();
    };
    synth.speak(u);
  };

  synth.cancel();
  opts.onRead?.(1);
  speak(1);

  return () => {
    stopped = true;
    window.clearTimeout(pause);
    window.clearTimeout(watchdog);
    synth.cancel();
  };
}
