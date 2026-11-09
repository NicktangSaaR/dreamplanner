import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { ChevronDown, FileDown, Loader2, Pencil, Save, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { downloadReportDocx, downloadReportPdf } from "@/components/engines/reportExport";
import { MD } from "@/components/engines/markdownStyles";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MessageKey } from "@/i18n/translations";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { gradSummary, type Track } from "@/shared/planning";
import { QUARTERS, academicYear, currentQuarter, db, fmtDate, parseGoals, type QuarterKey } from "./planData";

type Report = {
  id: string;
  report_type: "quarterly" | "annual";
  title: string;
  quarter: string | null;
  academic_year: string | null;
  final_content: string | null;
  ai_draft: string | null;
  status: "draft" | "published";
  created_at: string;
};

export type ReportRequest = { kind: "quarterly" | "annual"; quarter: QuarterKey; nonce: number } | null;

const PHASE_EN: Record<string, string> = {
  exploration: "Exploration", positioning: "Positioning", consolidation: "Consolidation", application: "Application",
  grad_positioning: "Positioning", grad_background: "Profile Building", grad_materials: "Materials", grad_application: "Applications", grad_admission: "Admissions",
};

type ResumeRow = { work_experience?: { company?: string; position?: string; startDate?: string; endDate?: string; description?: string }[]; projects?: { name?: string; role?: string; description?: string }[] };
const experienceLines = (row: ResumeRow | undefined): string[] => [
  ...(row?.work_experience || []).map((w) => `工作/实习：${w.company || ""} ${w.position || ""}（${w.startDate || ""}–${w.endDate || ""}）${(w.description || "").replace(/\s+/g, " ").slice(0, 300)}`),
  ...(row?.projects || []).map((p) => `科研/项目：${p.name || ""}${p.role ? ` - ${p.role}` : ""} ${(p.description || "").replace(/\s+/g, " ").slice(0, 300)}`),
];

export default function ReportsTimeline({
  studentId, studentName, phase, request, track,
}: {
  track: Track;
  studentId: string;
  studentName: string;
  phase: string;
  request: ReportRequest;
}) {
  const { t, lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const key = ["planning-reports", studentId];
  const year = academicYear();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db
        .from("planning_reports")
        .select("id, report_type, title, quarter, academic_year, final_content, ai_draft, status, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Report[];
    },
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const content = (r: Report) => r.final_content || r.ai_draft || "";
  const dateLabel = (r: Report) => `${t("plan.reports.generatedOn")} ${fmtDate(r.created_at, lang)}`;

  const update = async (r: Report, patch: Partial<Report>, ok: string) => {
    const { error } = await db.from("planning_reports").update(patch).eq("id", r.id);
    if (error) {
      toast.error(L("保存失败", "Couldn't save"));
      return;
    }
    toast.success(ok);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: key });
  };

  const remove = async (r: Report) => {
    if (!window.confirm(L(`删除「${r.title}」？`, `Delete “${r.title}”?`))) return;
    const { error } = await db.from("planning_reports").delete().eq("id", r.id);
    if (error) toast.error(L("删除失败", "Couldn't delete"));
    queryClient.invalidateQueries({ queryKey: key });
  };

  const exportAs = async (r: Report, kind: "word" | "pdf") => {
    setBusyId(`${r.id}-${kind}`);
    try {
      if (kind === "word") await downloadReportDocx(r.title, content(r), dateLabel(r));
      else await downloadReportPdf(r.title, content(r), dateLabel(r));
    } catch {
      toast.error(t("plan.reports.exportFailed"));
    } finally {
      setBusyId(null);
    }
  };

  // ---------------- generate ----------------
  const [dialog, setDialog] = useState(false);
  const [kind, setKind] = useState<"quarterly" | "annual">("quarterly");
  const [quarter, setQuarter] = useState<QuarterKey>(currentQuarter());
  const [reportLang, setReportLang] = useState<"zh" | "en">(lang === "en" ? "en" : "zh");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!request) return;
    setKind(request.kind);
    setQuarter(request.quarter);
    setDialog(true);
  }, [request]);

  const generate = async () => {
    setGenerating(true);
    try {
      const grad = track.applicantType === "graduate";
      const [courses, activities, quarters, docs, meetings] = await Promise.all([
        supabase.from("courses").select("name, grade, course_type").eq("student_id", studentId),
        // Graduate applicants have no extracurriculars: use the experience and projects from their resume.
        grad
          ? db.from("resume_data").select("work_experience, projects").eq("student_id", studentId).order("updated_at", { ascending: false }).limit(1)
          : supabase.from("extracurricular_activities").select("name, role, description").eq("student_id", studentId),
        db.from("student_quarters").select("quarter, quarter_focus, quarter_kpi").eq("student_id", studentId).eq("academic_year", year),
        db.from("planning_documents").select("content, is_primary, updated_at").eq("student_id", studentId).order("is_primary", { ascending: false }).order("updated_at", { ascending: false }).limit(1),
        db.from("student_meetings").select("meeting_date, title, summary, quarter").eq("student_id", studentId).eq("academic_year", year).order("meeting_date"),
      ]);
      const kpiLines = (quarters.data || [])
        .filter((q: { quarter: string }) => kind === "annual" || q.quarter === quarter)
        .map((q: { quarter: string; quarter_focus: string | null; quarter_kpi: string | null }) => {
          const goals = parseGoals(q.quarter_kpi);
          const label = QUARTERS.find((x) => x.key === q.quarter)?.zh || q.quarter;
          const list = goals.map((g) => `${g.completed ? "✅" : "⬜"} ${g.text}`).join("；") || "暂无";
          return `${label}：重点=${q.quarter_focus || "未设定"}；目标完成 ${goals.filter((g) => g.completed).length}/${goals.length} — ${list}`;
        });
      const meetingLines = (meetings.data || [])
        .filter((m: { quarter: string }) => kind === "annual" || m.quarter === quarter)
        .map((m: { meeting_date: string; title: string | null; summary: string | null }) => `${m.meeting_date.slice(0, 10)} ${m.title || "会议"}：${m.summary || ""}`);

      const { data, error } = await supabase.functions.invoke("generate-planning-report", {
        body: {
          reportType: kind,
          studentName,
          phase,
          quarter,
          academicYear: year,
          kpiData: [...kpiLines, ...(meetingLines.length ? ["", "本期会议记录：", ...meetingLines] : [])].join("\n") || "暂无",
          courseSummary: (courses.data || []).map((c) => `${c.name} (${c.course_type || "Regular"}) - ${c.grade}`).join("\n") || "暂无",
          activitySummary: (grad ? experienceLines(activities.data?.[0]) : (activities.data || []).map((a: { name: string; role: string; description: string | null }) => `${a.name} - ${a.role}: ${a.description || ""}`)).join("\n") || "暂无",
          planningDocContent: docs.data?.[0]?.content || "",
          language: reportLang,
          applicantType: track.applicantType,
          applicantProfile: track.applicantType === "graduate" ? gradSummary(track, "zh") : undefined,
          gradDegree: track.gradDegree || undefined,
        },
      });
      if (error || !data?.report) throw new Error(data?.error || error?.message || "");
      const q = QUARTERS.find((x) => x.key === quarter)!;
      const phaseZh = t(`plan.phase.${phase}` as MessageKey);
      const title = reportLang === "en"
        ? kind === "quarterly" ? `${year} ${q.en} Quarterly Review` : `${year} ${PHASE_EN[phase] || ""} Stage Summary`
        : kind === "quarterly" ? `${year} ${q.zh} 季度评估` : `${year} ${phaseZh} 阶段总结`;
      const { data: row, error: insErr } = await db
        .from("planning_reports")
        .insert({
          student_id: studentId, report_type: kind, title,
          quarter: kind === "quarterly" ? quarter : null, academic_year: year, phase,
          ai_draft: data.report, final_content: data.report, generated_by: profile?.id, status: "draft",
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      await queryClient.invalidateQueries({ queryKey: key });
      setOpenId(row.id);
      setDialog(false);
      toast.success(L("报告已生成（草稿），检查后点「发布给学生」", "Draft ready. Review it, then publish."));
    } catch (e) {
      toast.error(`${L("生成失败", "Couldn't generate")}${e instanceof Error && e.message ? `：${e.message}` : ""}`);
    } finally {
      setGenerating(false);
    }
  };

  const shownId = openId ?? reports[0]?.id ?? null;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-pine">
            {L("报告", "Reports")} <span className="text-sm font-normal text-muted-foreground">· {L(`${reports.length} 份`, `${reports.length}`)}</span>
          </h2>
          <Button onClick={() => { setKind("quarterly"); setQuarter(currentQuarter()); setDialog(true); }}>
            <Sparkles className="mr-1.5 h-4 w-4" /> {L("生成报告", "Write a report")}
          </Button>
        </div>

        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : reports.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {L("还没有报告。季末生成季度评估，一个阶段结束时生成阶段总结。", "No reports yet. Write a quarterly review at the end of each quarter, and a stage summary when a stage ends.")}
          </p>
        ) : (
          <ol className="relative space-y-3 border-l pl-5">
            {reports.map((r) => {
              const open = shownId === r.id;
              const isEditing = editing === r.id;
              return (
                <li key={r.id} className="relative">
                  <span className={cn("absolute -left-[26px] top-4 h-2.5 w-2.5 rounded-full border-2 border-background", r.status === "published" ? "bg-primary" : "bg-brass")} />
                  <div className="rounded-md border bg-card">
                    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                      <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setOpenId(open ? "" : r.id)} aria-expanded={open}>
                        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
                        <Badge variant="outline" className="shrink-0">{r.report_type === "quarterly" ? L("季度评估", "Quarterly") : L("阶段总结", "Stage")}</Badge>
                        <span className="truncate text-sm font-medium">{r.title}</span>
                      </button>
                      <span className="text-xs text-muted-foreground">{fmtDate(r.created_at, lang)}</span>
                      {r.status === "draft" ? (
                        <Badge className="bg-brass/15 text-brass hover:bg-brass/15">{L("草稿 · 学生看不到", "Draft · hidden from student")}</Badge>
                      ) : (
                        <Badge variant="secondary">{L("已发布", "Published")}</Badge>
                      )}
                    </div>
                    {open && (
                      <div className="space-y-3 border-t px-4 py-3">
                        {isEditing ? (
                          <>
                            <Textarea rows={16} value={draft} onChange={(e) => setDraft(e.target.value)} className="font-mono text-sm" />
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => void update(r, { final_content: draft, status: "published" }, L("已保存并发布", "Saved and published"))}>
                                <Send className="mr-1 h-3.5 w-3.5" /> {L("保存并发布", "Save & publish")}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => void update(r, { final_content: draft }, L("已保存", "Saved"))}>
                                <Save className="mr-1 h-3.5 w-3.5" /> {L("保存", "Save")}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>{L("取消", "Cancel")}</Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-2 text-sm leading-relaxed">
                              <ReactMarkdown components={MD}>{content(r)}</ReactMarkdown>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button size="sm" variant="outline" onClick={() => { setEditing(r.id); setDraft(content(r)); }}>
                                <Pencil className="mr-1 h-3.5 w-3.5" /> {L("编辑", "Edit")}
                              </Button>
                              <Button size="sm" variant="outline" disabled={busyId === `${r.id}-word`} onClick={() => void exportAs(r, "word")}>
                                {busyId === `${r.id}-word` ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <FileDown className="mr-1 h-3.5 w-3.5" />} Word
                              </Button>
                              <Button size="sm" variant="outline" disabled={busyId === `${r.id}-pdf`} onClick={() => void exportAs(r, "pdf")}>
                                {busyId === `${r.id}-pdf` ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <FileDown className="mr-1 h-3.5 w-3.5" />} PDF
                              </Button>
                              {r.status === "draft" ? (
                                <Button size="sm" onClick={() => void update(r, { status: "published" }, L("已发布给学生", "Published to the student"))}>
                                  <Send className="mr-1 h-3.5 w-3.5" /> {L("发布给学生", "Publish to student")}
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" onClick={() => void update(r, { status: "draft" }, L("已撤回为草稿", "Moved back to draft"))}>
                                  {L("撤回为草稿", "Unpublish")}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => void remove(r)}>
                                <Trash2 className="mr-1 h-3.5 w-3.5" /> {L("删除", "Delete")}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>

      <Dialog open={dialog} onOpenChange={(o) => !generating && setDialog(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{L("生成报告", "Write a report")}</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {(["quarterly", "annual"] as const).map((k) => (
                <button key={k} onClick={() => setKind(k)}
                  className={cn("rounded-md border p-3 text-left", kind === k ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                  <span className="block font-medium">{k === "quarterly" ? L("季度评估", "Quarterly review") : L("阶段总结", "Stage summary")}</span>
                  <span className="text-xs text-muted-foreground">{k === "quarterly" ? L("季末回顾目标和会议", "Goals and meetings this quarter") : L("一个阶段结束时的整体总结", "When a stage ends")}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {kind === "quarterly" && (
                <div className="space-y-1.5">
                  <Label>{L("季度", "Quarter")}</Label>
                  <Select value={quarter} onValueChange={(v) => setQuarter(v as QuarterKey)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{QUARTERS.map((x) => <SelectItem key={x.key} value={x.key}>{L(x.zh, x.en)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>{L("语言", "Language")}</Label>
                <Select value={reportLang} onValueChange={(v) => setReportLang(v as "zh" | "en")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{L("会参考本期的目标完成情况和会议记录。生成后是草稿，学生看不到；检查修改后再发布。", "Uses this period's goals and meeting records. It starts as a draft the student can't see.")}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(false)} disabled={generating}>{L("取消", "Cancel")}</Button>
            <Button onClick={() => void generate()} disabled={generating}>
              {generating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} {L("生成", "Generate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
