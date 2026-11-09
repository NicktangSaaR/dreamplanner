import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/i18n/LanguageProvider";
import { todayIso } from "@/features/counselor/plan/planData";

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * Pick a new date (with quick +3 days / +1 week / +2 weeks) and an optional
 * reason. Used to postpone a task, and by students to ask for an extension.
 */
export default function ReschedulePopover({
  current, onConfirm, children, title, confirmLabel, reasonRequired = false,
}: {
  current: string | null;
  onConfirm: (due: string, reason: string) => Promise<void> | void;
  children: ReactNode;
  title?: string;
  confirmLabel?: string;
  reasonRequired?: boolean;
}) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const base = current && current > todayIso() ? current : todayIso();
  const [open, setOpen] = useState(false);
  const [due, setDue] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!due) return;
    setBusy(true);
    try {
      await onConfirm(due, reason.trim());
      setOpen(false);
      setDue("");
      setReason("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setDue(""); }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <p className="text-sm font-medium">{title || L("改期", "Change date")}</p>
        {current && <p className="text-xs text-muted-foreground">{L(`现在截止：${current}`, `Currently due ${current}`)}</p>}
        <div className="flex flex-wrap gap-1.5">
          {[[3, L("推迟 3 天", "+3 days")], [7, L("推迟 1 周", "+1 week")], [14, L("推迟 2 周", "+2 weeks")]].map(([n, label]) => (
            <Button key={n} type="button" size="sm" variant={due === addDays(base, n as number) ? "default" : "outline"} className="h-7 px-2 text-xs"
              onClick={() => setDue(addDays(base, n as number))}>
              {label}
            </Button>
          ))}
        </div>
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label={L("新日期", "New date")} />
        <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200}
          placeholder={reasonRequired ? L("原因（必填）", "Reason (required)") : L("原因（可选）", "Reason (optional)")} aria-label={L("原因", "Reason")} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>{L("取消", "Cancel")}</Button>
          <Button type="button" size="sm" onClick={() => void confirm()} disabled={!due || busy || (reasonRequired && !reason.trim())}>
            {busy && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}{confirmLabel || L("确定", "Confirm")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
