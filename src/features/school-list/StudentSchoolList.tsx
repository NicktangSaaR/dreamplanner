import { useLanguage } from "@/i18n/LanguageProvider";
import { daysUntil, STATUS_LABEL, SYSTEM_LABEL, useSchoolList } from "./data";

const fmt = (d: string, lang: "zh" | "en") =>
  lang === "zh" ? `${d.slice(0, 4)}年${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日` : new Date(`${d}T12:00:00`).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });

/** The student's own school list, read-only: their counselor keeps it up to date. */
export default function StudentSchoolList({ studentId }: { studentId: string }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { data: list = [], isLoading } = useSchoolList(studentId);
  if (isLoading) return <p className="text-sm text-muted-foreground">{L("加载中…", "Loading…")}</p>;
  const shown = list.filter((s) => s.status !== "withdrawn");
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {L("学校和截止日期由顾问确定。每所学校要做的事会放进你的待办里。想加学校或换专业，请和顾问商量。", "Your counselor keeps this list up to date. What each school needs goes on your to-do list. Talk to your counselor about changes.")}
      </p>
      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{L("顾问还没有为你建好选校单。", "Your counselor hasn't set up your school list yet.")}</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((s) => {
            const days = daysUntil(s.deadline);
            const open = s.status === "preparing" || s.status === "considering";
            return (
              <li key={s.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{s.college_name}</p>
                    {s.major && <p className="text-sm text-muted-foreground">{s.major}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${s.status === "submitted" || s.status === "admitted" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABEL[s.status][lang]}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  {[s.round, s.application_system ? SYSTEM_LABEL[s.application_system] : ""].filter(Boolean).join(" · ")}
                  {s.deadline && (
                    <>
                      {(s.round || s.application_system) && " · "}
                      {L("截止", "Due")} {fmt(s.deadline, lang)}
                      {open && days != null && days >= 0 && (
                        <span className={days <= 21 ? "ml-1 font-medium text-[#9A3B12]" : "ml-1 text-muted-foreground"}>
                          {L(`（还有 ${days} 天）`, `(${days} days left)`)}
                        </span>
                      )}
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
