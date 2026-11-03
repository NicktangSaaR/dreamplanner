import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { messages } from "./translations";
import type { MessageKey } from "./translations";

export type Language = "zh" | "en";

const STORAGE_KEY = "dreamplanner.lang";

function initialLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch {
    // Storage can be unavailable (private mode); fall through.
  }
  // Default to Chinese unless the browser clearly prefers another language
  // and does not list Chinese at all.
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  if (prefs.some((l) => l?.toLowerCase().startsWith("zh"))) return "zh";
  return prefs[0]?.toLowerCase().startsWith("en") ? "en" : "zh";
}

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggle: () => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
  }, [lang]);

  const setLang = useCallback((next: Language) => setLangState(next), []);
  const toggle = useCallback(() => setLangState((l) => (l === "zh" ? "en" : "zh")), []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      let text = messages[lang][key] ?? messages.zh[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.split(`{${name}}`).join(String(value));
        }
      }
      return text;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, toggle, t }), [lang, setLang, toggle, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
