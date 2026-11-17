import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { messages } from "./translations";
import type { MessageKey } from "./translations";

export type Language = "zh" | "en";

const STORAGE_KEY = "dreamplanner.lang";
/** Set once the person has picked a site language themselves (not just the browser default). */
const CHOSEN_KEY = "dreamplanner.lang.chosen";

const chosen = () => {
  try {
    return window.localStorage.getItem(CHOSEN_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * A language picked on the site becomes the person's email language.
 * `onlyIfUnset` (used at sign-in) fills it in without overriding a setting.
 */
async function syncEmailLanguage(lang: Language, onlyIfUnset = false) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const id = session?.user?.id;
    if (!id) return;
    const db = supabase as any;
    let q = db.from("profiles").update({ email_language: lang }).eq("id", id);
    if (onlyIfUnset) q = q.is("email_language", null);
    await q;
  } catch {
    // Best effort; emails fall back to both languages.
  }
}

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
  /** `email: false` for a choice that shouldn't change the email language (e.g. the mock interview). */
  setLang: (lang: Language, opts?: { email?: boolean }) => void;
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

  // Explicit choices: remember that it was chosen and use it for emails too.
  const choose = useCallback((next: Language, email = true) => {
    setLangState(next);
    if (!email) return;
    try {
      window.localStorage.setItem(CHOSEN_KEY, "1");
    } catch {
      // ignore
    }
    void syncEmailLanguage(next);
  }, []);
  const setLang = useCallback((next: Language, opts?: { email?: boolean }) => choose(next, opts?.email !== false), [choose]);
  const toggle = useCallback(() => choose(lang === "zh" ? "en" : "zh"), [choose, lang]);

  // At sign-in, a language chosen earlier on this device fills in an unset email language.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" && chosen()) {
        let saved: Language | null = null;
        try {
          const v = window.localStorage.getItem(STORAGE_KEY);
          saved = v === "zh" || v === "en" ? v : null;
        } catch {
          // ignore
        }
        if (saved) setTimeout(() => void syncEmailLanguage(saved!, true), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

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
