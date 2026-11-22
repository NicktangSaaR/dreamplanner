import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { type StudentMessage, formatWhen } from "./data";

/** Messages newest first; long ones collapse. `staff` shows delivery details. */
export default function MessageList({ messages, staff = false, limit }: { messages: StudentMessage[]; staff?: boolean; limit?: number }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const shown = limit && !all ? messages.slice(0, limit) : messages;

  return (
    <div>
      <ul className="divide-y rounded-md border bg-card">
        {shown.map((m) => {
          const long = m.body.length > 220 || m.body.split("\n").length > 4;
          const expanded = open.has(m.id);
          return (
            <li key={m.id} className="space-y-1 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="font-medium">{m.subject || L("（无标题）", "(No subject)")}</p>
                <p className="text-xs text-muted-foreground">
                  {formatWhen(m.created_at, lang)}{m.sender?.full_name ? ` · ${m.sender.full_name}` : ""}
                  {staff && (m.emailed ? ` · ${L("已发邮件", "Emailed")}${m.cc_parent ? L("（抄送家长）", " (parent cc'd)") : ""}` : ` · ${L("未发出邮件", "Not emailed")}`)}
                </p>
              </div>
              <p className={`whitespace-pre-wrap text-sm text-foreground/90 ${long && !expanded ? "line-clamp-4" : ""}`}>{m.body}</p>
              {long && (
                <button type="button" className="text-xs text-primary hover:underline" aria-expanded={expanded}
                  onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })}>
                  {expanded ? L("收起", "Show less") : L("展开全文", "Show all")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {limit && messages.length > limit && (
        <button type="button" className="mt-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setAll((v) => !v)}>
          {all ? L("收起", "Show fewer") : L(`查看全部 ${messages.length} 条`, `Show all ${messages.length}`)}
        </button>
      )}
    </div>
  );
}
