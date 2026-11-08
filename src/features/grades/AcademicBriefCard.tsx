import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BellRing, ChevronDown, ClipboardPaste, FileText, GraduationCap, Loader2, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  REPORT_CARD_ACCEPT, ReportCardError, db, deleteReportCard, openReportCard, uploadReportCard,
  type ReportCard, type UploadRequest,
} from "./reportCards";

type Course = { name?: string; grade?: string | null; percent?: number | null; comment?: string | null };
type BriefData = {
  period?: string | null; school?: string | null; courses?: Course[]; overall?: string;
  changes?: string[]; risks?: string[]; suggestions?: string[];
};
type Brief = { report_id: string; brief: string | null; data: BriefData | null; error: string | null };

function BriefView({ d }: { d: BriefData }) {
  const { t } = useLanguage();
  const list = (title: string, items?: string[], tone = "") =>
    items?.length ? (
      <div>
        <p className={`text-sm font-semibold ${tone}`}>{title}</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>
      </div>
    ) : null;
  return (
    <div className="space-y-3">
      {(d.school || d.period) && <p className="text-xs text-muted-foreground">{[d.school, d.period].filter(Boolean).join(" · ")}</p>}
      {d.overall && <p className="text-sm leading-relaxed">{d.overall}</p>}
      {!!d.courses?.length && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr><th className="py-1 pr-3 font-medium">{t("grades.col.course")}</th><th className="py-1 pr-3 font-medium">{t("grades.col.grade")}</th><th className="py-1 pr-3 font-medium">%</th><th className="py-1 font-medium">{t("grades.col.comment")}</th></tr>
            </thead>
            <tbody>
              {d.courses.map((c, n) => (
                <tr key={n} className="border-t align-top">
                  <td className="py-1.5 pr-3 font-medium">{c.name}</td>
                  <td className="py-1.5 pr-3">{c.grade ?? "—"}</td>
                  <td className="py-1.5 pr-3">{c.percent ?? "—"}</td>
                  <td className="py-1.5 text-muted-foreground">{c.comment ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list(t("grades.changes"), d.changes)}
      {list(t("grades.risks"), d.risks, "text-destructive")}
      {list(t("grades.suggestions"), d.suggestions)}
    </div>
  );
}

/** Counselor view: grade briefs written by AI from uploaded report cards, and upload requests. */
export default function AcademicBriefCard({ studentId }: { studentId: string }) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pastePeriod, setPastePeriod] = useState("");
  const [due, setDue] = useState("");
  const [message, setMessage] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const keys = { reports: ["report-cards", studentId], briefs: ["report-briefs", studentId], req: ["report-request", studentId] };

  const { data: reports = [], isLoading } = useQuery({
    queryKey: keys.reports,
    queryFn: async () => {
      const { data, error } = await db.from("academic_reports").select("*").eq("student_id", studentId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ReportCard[];
    },
    // Keep checking while a brief is being written.
    refetchInterval: (q) => ((q.state.data as ReportCard[] | undefined)?.some((r) => r.status === "processing") ? 5000 : false),
  });

  const { data: briefs = [] } = useQuery({
    queryKey: [...keys.briefs, reports.map((r) => r.status).join()],
    enabled: reports.length > 0,
    queryFn: async () => {
      const { data } = await db.from("academic_report_briefs").select("report_id, brief, data, error").eq("student_id", studentId);
      return (data || []) as Brief[];
    },
  });
  const briefOf = new Map(briefs.map((b) => [b.report_id, b]));
  const latestId = reports.find((r) => r.status === "ready")?.id;
  const shownId = openId ?? latestId ?? null;

  const { data: request } = useQuery({
    queryKey: keys.req,
    queryFn: async () => {
      const { data } = await db.from("academic_report_requests").select("*").eq("student_id", studentId)
        .is("fulfilled_at", null).order("due_date").limit(1).maybeSingle();
      return (data || null) as UploadRequest | null;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: keys.reports });
    queryClient.invalidateQueries({ queryKey: keys.req });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      await uploadReportCard(studentId, file);
      toast.success(t("grades.analyzing"));
      refresh();
    } catch (err) {
      const reason = err instanceof ReportCardError ? err.message : "";
      toast.error(reason === "type" ? t("grades.badType") : reason === "size" ? t("grades.tooBig") : t("grades.uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const sendRequest = async () => {
    if (!due) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("academic-report", {
      body: { action: "request", student_id: studentId, due_date: due, message: message.trim() || undefined },
    });
    setBusy(false);
    if (error || data?.error) {
      toast.error(t("grades.requestFailed"));
      return;
    }
    toast.success(t("grades.requestSent"));
    setAsking(false);
    setDue("");
    setMessage("");
    refresh();
  };

  const savePasted = async () => {
    if (!pasteText.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("academic-report", {
      body: { action: "manual", student_id: studentId, brief: pasteText, period_label: pastePeriod.trim() || undefined },
    });
    setBusy(false);
    if (error || data?.error) {
      toast.error(t("grades.pasteFailed"));
      return;
    }
    toast.success(t("grades.pasteSaved"));
    setPasting(false);
    setPasteText("");
    setPastePeriod("");
    setOpenId(data?.id ?? null);
    refresh();
    queryClient.invalidateQueries({ queryKey: keys.briefs });
  };

  const cancelRequest = async () => {
    if (!request) return;
    await db.from("academic_report_requests").delete().eq("id", request.id);
    refresh();
  };

  const retry = async (id: string) => {
    await db.from("academic_reports").update({ status: "processing" }).eq("id", id);
    await supabase.functions.invoke("academic-report", { body: { action: "analyze", report_id: id } });
    refresh();
  };

  const [deleting, setDeleting] = useState<string | null>(null);
  const deleteReport = async (r: ReportCard) => {
    if (!window.confirm(t("grades.deleteConfirm", { name: r.period_label || r.file_name || t("grades.manualTag") }))) return;
    setDeleting(r.id);
    try {
      await deleteReportCard(r);
      toast.success(t("grades.deleted"));
      queryClient.invalidateQueries({ queryKey: keys.reports });
      queryClient.invalidateQueries({ queryKey: keys.briefs });
    } catch {
      toast.error(t("grades.deleteFailed"));
    } finally {
      setDeleting(null);
    }
  };

  const fmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-CA");
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" /> {t("grades.briefTitle")}
        </CardTitle>
        <div className="flex gap-2">
          <input ref={inputRef} type="file" accept={REPORT_CARD_ACCEPT} className="hidden" onChange={onFile} />
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setPasting((v) => !v)}>
            <ClipboardPaste className="mr-1.5 h-4 w-4" /> {t("grades.paste")}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload className="mr-1.5 h-4 w-4" /> {t("grades.uploadForStudent")}
          </Button>
          {!request && !asking && (
            <Button size="sm" onClick={() => setAsking(true)}>
              <BellRing className="mr-1.5 h-4 w-4" /> {t("grades.ask")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {request && (
          <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/30 p-3 text-sm">
            <div>
              <p className="font-medium">
                {request.due_date < minDate ? t("grades.requestOverdue", { date: request.due_date }) : t("grades.requestOpen", { date: request.due_date })}
              </p>
              {request.message && <p className="mt-1 text-muted-foreground">{request.message}</p>}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={t("grades.cancelRequest")} onClick={() => void cancelRequest()}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {pasting && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <Input value={pastePeriod} onChange={(e) => setPastePeriod(e.target.value)} placeholder={t("grades.periodPlaceholder")} maxLength={60} className="sm:max-w-xs" />
            <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={t("grades.pastePlaceholder")} rows={8} maxLength={20000} />
            <div className="flex gap-2">
              <Button size="sm" disabled={!pasteText.trim() || busy} onClick={() => void savePasted()}>{t("grades.pasteSave")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setPasting(false)}>{t("team.cancel")}</Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("grades.pasteHint")}</p>
          </div>
        )}

        {asking && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-sm" htmlFor={`due-${studentId}`}>{t("grades.dueBy")}</label>
              <Input id={`due-${studentId}`} type="date" min={minDate} value={due} onChange={(e) => setDue(e.target.value)} className="sm:w-44" />
            </div>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("grades.messagePlaceholder")} maxLength={500} rows={2} />
            <div className="flex gap-2">
              <Button size="sm" disabled={!due || busy} onClick={() => void sendRequest()}>{t("grades.sendRequest")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>{t("team.cancel")}</Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("grades.requestHint")}</p>
          </div>
        )}

        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("grades.noneCounselor")}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {reports.map((r) => {
              const b = briefOf.get(r.id);
              const expanded = shownId === r.id;
              return (
                <li key={r.id}>
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setOpenId(expanded ? "" : r.id)}
                      aria-expanded={expanded}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      <span className="truncate font-medium">{r.period_label || r.file_name || t("grades.manualTag")}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{fmt(r.created_at)}</span>
                    </button>
                    {r.status === "processing" && (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("grades.processing")}
                      </span>
                    )}
                    {r.status === "failed" && (
                      <Button variant="ghost" size="sm" className="h-7 shrink-0 text-xs" onClick={() => void retry(r.id)}>
                        <RefreshCw className="mr-1 h-3.5 w-3.5" /> {t("grades.retry")}
                      </Button>
                    )}
                    {r.file_path ? (
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={t("grades.openFile")}
                        onClick={() => void openReportCard(r.file_path as string).catch(() => toast.error(t("grades.openFailed")))}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground">{t("grades.manualTag")}</span>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={t("grades.delete")}
                      disabled={deleting === r.id} onClick={() => void deleteReport(r)}>
                      {deleting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  {expanded && (
                    <div className="border-t bg-muted/20 px-4 py-3">
                      {r.status === "failed" ? (
                        <p className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" /> {b?.error || t("grades.failed")}
                        </p>
                      ) : b?.data ? (
                        <BriefView d={b.data} />
                      ) : b?.brief ? (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{b.brief}</div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t("grades.processing")}</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
