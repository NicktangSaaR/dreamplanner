import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  BarChart3, Download, ExternalLink, FileText, FolderOpen, History, Loader2, Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MessageKey } from "@/i18n/translations";
import { useStudentPhase } from "@/components/engines/hooks/useStudentPhase";
import { useStudentQuarters } from "@/components/engines/hooks/useStudentQuarters";
import { PHASE_LABELS, QUARTER_DEFAULT_FOCUS } from "@/components/engines/types";
import EnginesDashboard from "@/components/engines/EnginesDashboard";
import SharedFolderDialog from "@/components/college-planning/SharedFolderDialog";
import { isSafeHttpUrl } from "@/lib/safeUrl";

interface KpiItem {
  id: string;
  text: string;
  completed: boolean;
}

function currentAcademicYear() {
  const now = new Date();
  const y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

function currentQuarter() {
  const m = new Date().getMonth();
  if (m >= 8 && m <= 10) return "Q1_fall";
  if (m >= 11 || m <= 1) return "Q2_winter";
  if (m >= 2 && m <= 4) return "Q3_spring";
  return "Q4_summer";
}

/** Parse stored goals. Only JSON lists can be ticked; plain text is shown read-only. */
function parseKpi(raw: string | null | undefined): { items: KpiItem[]; tickable: boolean } {
  if (!raw) return { items: [], tickable: false };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { items: parsed as KpiItem[], tickable: true };
  } catch {
    /* plain text */
  }
  const items = raw
    .split("\n")
    .map((l) => l.replace(/^[•\-\s]+/, "").trim())
    .filter(Boolean)
    .map((text, i) => ({ id: `line-${i}`, text, completed: false }));
  return { items, tickable: false };
}

type Doc = {
  id: string;
  title: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  phase: string | null;
  source_url: string | null;
  updated_at: string;
};

type Report = { id: string; title: string; final_content: string | null; ai_draft: string | null; created_at: string };

/**
 * The student's plan at a glance: stage, this quarter's focus and goals,
 * and one-click access to the latest plan document, latest report and the
 * shared folder. Older items live behind "History".
 */
export default function CurrentPlanCard({ studentId, grade }: { studentId: string; grade?: string | null }) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const { phase, isLoading: phaseLoading } = useStudentPhase(studentId);
  const { quarters, isLoading: quartersLoading } = useStudentQuarters(studentId);
  const [open, setOpen] = useState<"doc" | "report" | "history" | "folder" | null>(null);
  const [saving, setSaving] = useState(false);

  const phaseKey = phase?.current_phase || "exploration";
  const quarterKey = currentQuarter();
  const year = currentAcademicYear();
  const quarterRow = quarters.find((q) => q.quarter === quarterKey && q.academic_year === year);
  const focus = quarterRow?.quarter_focus || (quarterKey in QUARTER_DEFAULT_FOCUS ? t(`plan.focusDefault.${quarterKey}` as MessageKey) : "");
  const { items: goals, tickable } = useMemo(() => parseKpi(quarterRow?.quarter_kpi), [quarterRow?.quarter_kpi]);
  const doneCount = goals.filter((g) => g.completed).length;

  const { data: docs = [] } = useQuery({
    queryKey: ["student-home-docs", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_documents")
        .select("id, title, content, file_path, file_name, phase, source_url, updated_at")
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Doc[];
    },
  });
  const latestDoc = docs.find((d) => d.phase === phaseKey) || docs[0] || null;

  const { data: latestReport } = useQuery({
    queryKey: ["student-home-report", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_reports")
        .select("id, title, final_content, ai_draft, created_at")
        .eq("student_id", studentId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Report | null;
    },
  });

  const { data: folder } = useQuery({
    queryKey: ["shared-folder", studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("shared_folders").select("*").eq("created_by", studentId).maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const toggleGoal = async (goal: KpiItem) => {
    if (!quarterRow || !tickable) return;
    const next = goals.map((g) => (g.id === goal.id ? { ...g, completed: !g.completed } : g));
    setSaving(true);
    const { error } = await supabase
      .from("student_quarters")
      .update({ quarter_kpi: JSON.stringify(next) } as never)
      .eq("id", quarterRow.id);
    setSaving(false);
    if (error) {
      toast.error(t("home.goalSaveFailed"));
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["student-quarters", studentId] });
  };

  const saveFolder = async (data: { title: string; folder_url: string; description?: string }) => {
    if (!isSafeHttpUrl(data.folder_url)) {
      toast.error(t("home.folderBadUrl"));
      return;
    }
    const { error } = await supabase.from("shared_folders").upsert({ id: folder?.id, created_by: studentId, ...data });
    if (error) {
      toast.error(t("home.folderSaveFailed"));
      return;
    }
    toast.success(t("home.folderSaved"));
    setOpen(null);
    queryClient.invalidateQueries({ queryKey: ["shared-folder", studentId] });
  };

  const downloadDoc = async (doc: Doc) => {
    if (!doc.file_path) return;
    const { data, error } = await supabase.storage.from("planning-documents").download(doc.file_path);
    if (error || !data) {
      toast.error(t("home.downloadFailed"));
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name || "plan";
    a.click();
    URL.revokeObjectURL(url);
  };

  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-CA");
  const folderUrl = folder && isSafeHttpUrl(folder.folder_url) ? folder.folder_url : null;

  if (phaseLoading || quartersLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("plan.loading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        {/* Stage */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("plan.currentStage")}</span>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              {phaseKey in PHASE_LABELS ? t(`plan.phase.${phaseKey}` as MessageKey) : phaseKey}
            </Badge>
            {phase?.phase_start_date && (
              <span className="text-xs text-muted-foreground">{t("plan.since", { date: phase.phase_start_date })}</span>
            )}
          </div>
          {phase?.phase_notes && (
            <p className="mt-3 whitespace-pre-line border-l-2 border-primary/40 pl-3 text-sm leading-relaxed">
              {phase.phase_notes}
            </p>
          )}
        </div>

        {/* This quarter */}
        <div className="border-t pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-serif text-lg font-semibold text-pine">
              {t("home.thisQuarter", { quarter: t(`plan.quarter.${quarterKey}` as MessageKey) })}
            </h3>
            {goals.length > 0 && (
              <span className="text-sm text-muted-foreground">{t("home.goalsDone", { done: doneCount, total: goals.length })}</span>
            )}
          </div>
          {focus && <p className="mt-2 text-sm leading-relaxed">{focus}</p>}

          {goals.length > 0 && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className="h-full bg-primary transition-all" style={{ width: `${(doneCount / goals.length) * 100}%` }} />
            </div>
          )}

          {goals.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("plan.kpiEmpty")}</p>
          ) : (
            <ul className="mt-3 divide-y rounded-md border">
              {goals.map((g) => (
                <li key={g.id} className="flex items-start gap-3 px-3 py-2.5">
                  <Checkbox
                    id={`goal-${g.id}`}
                    checked={g.completed}
                    disabled={!tickable || saving}
                    onCheckedChange={() => void toggleGoal(g)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`goal-${g.id}`}
                    className={`text-sm leading-snug ${g.completed ? "text-muted-foreground line-through" : ""}`}
                  >
                    {g.text}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick access */}
        <div className="grid gap-2 border-t pt-5 sm:grid-cols-3">
          <Button variant="outline" className="justify-start" disabled={!latestDoc} onClick={() => setOpen("doc")}>
            <FileText className="mr-2 h-4 w-4" /> {t("home.planDoc")}
          </Button>
          <Button variant="outline" className="justify-start" disabled={!latestReport} onClick={() => setOpen("report")}>
            <BarChart3 className="mr-2 h-4 w-4" /> {t("home.latestReport")}
          </Button>
          {folderUrl ? (
            <div className="flex">
              <Button variant="outline" className="flex-1 justify-start rounded-r-none" asChild>
                <a href={folderUrl} target="_blank" rel="noopener noreferrer">
                  <FolderOpen className="mr-2 h-4 w-4" /> {t("plan.folder.title")}
                </a>
              </Button>
              <Button variant="outline" size="icon" className="rounded-l-none border-l-0" aria-label={t("plan.folder.edit")} onClick={() => setOpen("folder")}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="justify-start" onClick={() => setOpen("folder")}>
              <FolderOpen className="mr-2 h-4 w-4" /> {t("plan.folder.add")}
            </Button>
          )}
        </div>
        {(!latestDoc || !latestReport) && (
          <p className="-mt-3 text-xs text-muted-foreground">{t("home.notYetHint")}</p>
        )}

        <button
          type="button"
          onClick={() => setOpen("history")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <History className="h-4 w-4" /> {t("home.history")}
        </button>
      </CardContent>

      {/* Plan document */}
      <Dialog open={open === "doc"} onOpenChange={(o) => setOpen(o ? "doc" : null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {latestDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-pine">{latestDoc.title}</DialogTitle>
                <p className="text-xs text-muted-foreground">{t("home.updatedOn", { date: dateFmt(latestDoc.updated_at) })}</p>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                {latestDoc.source_url && isSafeHttpUrl(latestDoc.source_url) && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={latestDoc.source_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> {t("plan.docs.openInDrive")}
                    </a>
                  </Button>
                )}
                {latestDoc.file_path && (
                  <Button size="sm" variant="outline" onClick={() => void downloadDoc(latestDoc)}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> {t("home.download")}
                  </Button>
                )}
              </div>
              <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
                {latestDoc.content || t("plan.docs.noContent")}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Latest report */}
      <Dialog open={open === "report"} onOpenChange={(o) => setOpen(o ? "report" : null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {latestReport && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-pine">{latestReport.title}</DialogTitle>
                <p className="text-xs text-muted-foreground">{dateFmt(latestReport.created_at)}</p>
              </DialogHeader>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{latestReport.final_content || latestReport.ai_draft || ""}</ReactMarkdown>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* History: the full read-only plan */}
      <Dialog open={open === "history"} onOpenChange={(o) => setOpen(o ? "history" : null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-pine">{t("home.history")}</DialogTitle>
          </DialogHeader>
          {open === "history" && <EnginesDashboard studentId={studentId} grade={grade} readOnly hideFolder />}
        </DialogContent>
      </Dialog>

      <SharedFolderDialog
        open={open === "folder"}
        onOpenChange={(o) => setOpen(o ? "folder" : null)}
        onSubmit={saveFolder}
        initialData={folder || undefined}
      />
    </Card>
  );
}
