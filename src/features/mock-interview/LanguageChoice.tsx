import { useState } from "react";
import { Languages } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

const NEVER_KEY = "dreamplanner.mi.langAsk";

function shouldAsk() {
  try {
    return window.localStorage.getItem(NEVER_KEY) !== "never";
  } catch {
    return true;
  }
}

/**
 * Asked each time the mock interview opens: run it in Chinese or English?
 * (Interviews are usually in English, so students often want the English
 * interface.) "Don't ask again" keeps the current language from then on.
 */
export default function LanguageChoice() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(shouldAsk);
  const [never, setNever] = useState(false);

  const choose = (l: "zh" | "en") => {
    setLang(l);
    if (never) {
      try {
        window.localStorage.setItem(NEVER_KEY, "never");
      } catch {
        /* asked again next time */
      }
    }
    setOpen(false);
  };

  const options = [
    { l: "en" as const, title: "English", hint: "界面和提示都用英文，最接近真实面试" },
    { l: "zh" as const, title: "中文", hint: "Interface and prompts in Chinese" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && choose(lang === "en" ? "en" : "zh")}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-pine">
            <Languages className="h-5 w-5" /> 选择面试语言 · Choose a language
          </DialogTitle>
          <DialogDescription>
            模拟面试想用哪种语言界面？之后也可以在网站菜单里切换。
            <br />
            Which language would you like for the mock interview?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((o) => (
            <button
              key={o.l}
              type="button"
              onClick={() => choose(o.l)}
              className={cn(
                "rounded-md border bg-card p-4 text-left transition-colors hover:border-primary",
                lang === o.l && "border-primary ring-1 ring-primary",
              )}
            >
              <span className="block text-lg font-semibold text-pine">{o.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{o.hint}</span>
              {lang === o.l && <span className="mt-2 block text-xs text-primary">当前 · Current</span>}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={never} onCheckedChange={(c) => setNever(c === true)} />
          不再询问 · Don't ask again
        </label>
      </DialogContent>
    </Dialog>
  );
}
