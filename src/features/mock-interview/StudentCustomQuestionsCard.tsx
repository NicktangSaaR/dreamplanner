import { Loader2, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCustomQuestions } from "./useInterviewData";
import { formatSeconds } from "./types";

/** Read-only list of a student's own mock interview questions, for counselors. */
export default function StudentCustomQuestionsCard({ studentId }: { studentId: string }) {
  const { t, lang } = useLanguage();
  const { data = [], isLoading } = useCustomQuestions(studentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="h-5 w-5 text-primary" aria-hidden="true" />
          {t("mi.counselor.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("mi.counselor.empty")}</p>
        ) : (
          <ul className="divide-y">
            {data.map((q) => (
              <li key={q.id} className="py-3">
                <p className="leading-snug">{q.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {q.question_type === "written" ? t("mi.written") : t("mi.video")} · {t("mi.prep")}{" "}
                  {formatSeconds(q.preparation_time)} · {t("mi.response")} {formatSeconds(q.response_time)} ·{" "}
                  {new Date(q.created_at).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-CA")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
