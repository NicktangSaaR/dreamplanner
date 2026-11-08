import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  REPORT_CARD_ACCEPT, ReportCardError, db, deleteReportCard, openReportCard, uploadReportCard,
  type ReportCard, type UploadRequest,
} from "./reportCards";

/**
 * Student view: upload report cards and see what has been sent. The AI
 * brief is for the counselor team only, so it is not shown here.
 */
export default function StudentReportCards({ studentId }: { studentId: string }) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [period, setPeriod] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["report-cards", studentId],
    queryFn: async () => {
      const { data, error } = await db
        .from("academic_reports")
        .select("*")
        .eq("student_id", studentId)
        .eq("source", "upload")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ReportCard[];
    },
  });

  const { data: request } = useQuery({
    queryKey: ["report-request", studentId],
    queryFn: async () => {
      const { data } = await db
        .from("academic_report_requests")
        .select("*")
        .eq("student_id", studentId)
        .is("fulfilled_at", null)
        .order("due_date")
        .limit(1)
        .maybeSingle();
      return (data || null) as UploadRequest | null;
    },
  });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      await uploadReportCard(studentId, file, period);
      setPeriod("");
      toast.success(t("grades.uploaded"));
      queryClient.invalidateQueries({ queryKey: ["report-cards", studentId] });
      queryClient.invalidateQueries({ queryKey: ["report-request", studentId] });
    } catch (err) {
      const reason = err instanceof ReportCardError ? err.message : "";
      toast.error(reason === "type" ? t("grades.badType") : reason === "size" ? t("grades.tooBig") : t("grades.uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const [deleting, setDeleting] = useState<string | null>(null);
  const remove = async (r: ReportCard) => {
    if (!window.confirm(t("grades.deleteConfirm", { name: r.period_label || r.file_name || "" }))) return;
    setDeleting(r.id);
    try {
      await deleteReportCard(r);
      toast.success(t("grades.deleted"));
      queryClient.invalidateQueries({ queryKey: ["report-cards", studentId] });
    } catch {
      toast.error(t("grades.deleteFailed"));
    } finally {
      setDeleting(null);
    }
  };

  const fmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-CA");

  return (
    <div className="space-y-4">
      {request && (
        <div className="rounded-md border border-brass/40 bg-brass/10 p-4 text-sm">
          <p className="font-medium">{t("grades.requested", { date: request.due_date })}</p>
          {request.message && <p className="mt-1 text-foreground/80">{request.message}</p>}
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-sm text-muted-foreground">{t("grades.hint")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder={t("grades.periodPlaceholder")}
              aria-label={t("grades.periodPlaceholder")}
              className="sm:max-w-xs"
              maxLength={60}
            />
            <input ref={inputRef} type="file" accept={REPORT_CARD_ACCEPT} className="hidden" onChange={onFile} />
            <Button onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {t("grades.upload")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("grades.none")}</p>
      ) : (
        <ul className="divide-y rounded-md border bg-card">
          {reports.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <button
                type="button"
                onClick={() => r.file_path && void openReportCard(r.file_path).catch(() => toast.error(t("grades.openFailed")))}
                className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
              >
                {r.period_label || r.file_name}
              </button>
              {r.uploaded_by !== studentId && (
                <span className="shrink-0 text-xs text-muted-foreground">{t("grades.byTeam")}</span>
              )}
              <span className="shrink-0 text-xs text-muted-foreground">{fmt(r.created_at)}</span>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-label={t("grades.sent")} />
              {r.uploaded_by === studentId && (
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={t("grades.delete")}
                  disabled={deleting === r.id} onClick={() => void remove(r)}>
                  {deleting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
