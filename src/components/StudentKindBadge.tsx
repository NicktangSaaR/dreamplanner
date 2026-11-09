import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { STUDENT_KIND_LABEL, type StudentKind } from "@/shared/planning";

/** Colour per student type, shared by badges and profile cards. */
export const KIND_STYLE: Record<StudentKind, { badge: string; card: string; band: string; text: string }> = {
  undergrad: { badge: "border-track-ug/30 bg-track-ug/10 text-track-ug", card: "border-l-track-ug", band: "bg-track-ug/[0.06]", text: "text-track-ug" },
  transfer: { badge: "border-track-tr/30 bg-track-tr/10 text-track-tr", card: "border-l-track-tr", band: "bg-track-tr/[0.07]", text: "text-track-tr" },
  graduate: { badge: "border-track-grad/30 bg-track-grad/10 text-track-grad", card: "border-l-track-grad", band: "bg-track-grad/[0.07]", text: "text-track-grad" },
};

export default function StudentKindBadge({ kind, detail, className }: { kind: StudentKind; detail?: string | null; className?: string }) {
  const { lang } = useLanguage();
  const label = STUDENT_KIND_LABEL[kind][lang === "zh" ? "zh" : "en"];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", KIND_STYLE[kind].badge, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}{detail ? <span className="font-normal opacity-80">· {detail}</span> : null}
    </span>
  );
}
