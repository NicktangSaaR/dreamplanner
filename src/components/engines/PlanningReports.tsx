import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileBarChart, Sparkles, Save, Loader2, FileDown, Pencil, Eye, CalendarCheck, TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUARTER_LABELS, PHASE_LABELS } from "./types";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";

interface PlanningReportsProps {
  studentId: string;
  studentName?: string;
  currentPhase?: string;
}

const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
};

const getCurrentQuarter = () => {
  const month = new Date().getMonth();
  if (month >= 8 && month <= 10) return "Q1_fall";
  if (month >= 11 || month <= 1) return "Q2_winter";
  if (month >= 2 && month <= 4) return "Q3_spring";
  return "Q4_summer";
};

export default function PlanningReports({ studentId, studentName, currentPhase }: PlanningReportsProps) {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const isCounselor = profile?.user_type === "counselor" || profile?.user_type === "admin";

  const [activeTab, setActiveTab] = useState<string>("quarterly");
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [academicYear] = useState(getCurrentAcademicYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Fetch reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["planning-reports", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_reports")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // Check if annual report reminder is needed (1 year since registration)
  const { data: studentProfile } = useQuery({
    queryKey: ["student-profile-created", studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("created_at, full_name")
        .eq("id", studentId)
        .single();
      return data;
    },
    enabled: !!studentId,
  });

  const daysSinceRegistration = studentProfile?.created_at
    ? Math.floor((Date.now() - new Date(studentProfile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const needsAnnualReport = daysSinceRegistration >= 365;
  const hasAnnualReport = reports.some(r => (r as any).report_type === "annual" && (r as any).academic_year === academicYear);

  const quarterlyReports = reports.filter((r: any) => r.report_type === "quarterly");
  const annualReports = reports.filter((r: any) => r.report_type === "annual");

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ id, content, status }: { id: string; content: string; status?: string }) => {
      const { error } = await supabase
        .from("planning_reports")
        .update({ final_content: content, status: status || "published" } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-reports", studentId] });
      toast.success("报告已保存");
      setEditingId(null);
    },
    onError: () => toast.error("保存失败"),
  });

  const handleGenerate = async (reportType: "quarterly" | "annual") => {
    setIsGenerating(true);
    try {
      // Gather student data
      const [coursesRes, activitiesRes, quartersRes, docsRes] = await Promise.all([
        supabase.from("courses").select("name, grade, course_type, academic_year").eq("student_id", studentId),
        supabase.from("extracurricular_activities").select("name, role, description").eq("student_id", studentId),
        supabase.from("student_quarters").select("quarter, quarter_focus, quarter_kpi, academic_year").eq("student_id", studentId).eq("academic_year", academicYear),
        supabase.from("planning_documents").select("content, title").eq("student_id", studentId).order("created_at", { ascending: false }).limit(1),
      ]);

      const courseSummary = (coursesRes.data || [])
        .map(c => `${c.name} (${c.course_type || "Regular"}) - ${c.grade}`)
        .join("\n") || "暂无";

      const activitySummary = (activitiesRes.data || [])
        .map(a => `${a.name} - ${a.role}: ${a.description || ""}`)
        .join("\n") || "暂无";

      // Parse KPI data
      const kpiLines: string[] = [];
      for (const q of quartersRes.data || []) {
        const label = QUARTER_LABELS[q.quarter] || q.quarter;
        let kpiText = "暂无KPI";
        if (q.quarter_kpi) {
          try {
            const items = JSON.parse(q.quarter_kpi);
            if (Array.isArray(items)) {
              const completed = items.filter((i: any) => i.completed).length;
              kpiText = `${completed}/${items.length} 完成 — ${items.map((i: any) => `${i.completed ? "✅" : "⬜"} ${i.text}`).join(", ")}`;
            }
          } catch {
            kpiText = q.quarter_kpi;
          }
        }
        kpiLines.push(`${label}: 重点=${q.quarter_focus || "未设定"}, KPI=${kpiText}`);
      }

      const { data, error } = await supabase.functions.invoke("generate-planning-report", {
        body: {
          reportType,
          studentName: studentName || studentProfile?.full_name || "学生",
          phase: currentPhase || "exploration",
          quarter: selectedQuarter,
          academicYear,
          kpiData: kpiLines.join("\n") || "暂无",
          courseSummary,
          activitySummary,
          planningDocContent: docsRes.data?.[0]?.content || "",
        },
      });

      if (error) throw error;

      const title = reportType === "quarterly"
        ? `${academicYear} ${QUARTER_LABELS[selectedQuarter] || selectedQuarter} 季度评估`
        : `${academicYear} ${PHASE_LABELS[currentPhase || "exploration"] || ""} 阶段总结`;

      const { error: insertError } = await supabase
        .from("planning_reports")
        .insert({
          student_id: studentId,
          report_type: reportType,
          title,
          quarter: reportType === "quarterly" ? selectedQuarter : null,
          academic_year: academicYear,
          phase: currentPhase || "exploration",
          ai_draft: data.report,
          final_content: data.report,
          generated_by: profile?.id,
          status: "draft",
        } as any);

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["planning-reports", studentId] });
      toast.success("报告已生成");
    } catch (err: any) {
      console.error(err);
      toast.error(`生成失败: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = (report: any) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;

    doc.setFontSize(16);
    doc.text(report.title, margin, margin + 10);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(report.created_at).toLocaleDateString("zh-CN")}`, margin, margin + 20);

    doc.setFontSize(11);
    const content = report.final_content || report.ai_draft || "";
    // Simple text wrapping for PDF
    const cleanContent = content.replace(/[#*`]/g, "").replace(/\n{3,}/g, "\n\n");
    const lines = doc.splitTextToSize(cleanContent, pageWidth);

    let y = margin + 30;
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    }

    doc.save(`${report.title}.pdf`);
    toast.success("PDF已下载");
  };

  const renderReport = (report: any) => {
    const isEditing = editingId === report.id;
    const content = report.final_content || report.ai_draft || "";

    return (
      <div key={report.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{report.title}</h3>
            <Badge variant={report.status === "published" ? "default" : "secondary"} className="text-xs">
              {report.status === "published" ? "已发布" : "草稿"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {new Date(report.created_at).toLocaleDateString("zh-CN")}
            </span>
            {isCounselor && !isEditing && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                onClick={() => { setEditingId(report.id); setEditContent(content); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleExportPDF(report)}>
              <FileDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={15}
              className="text-sm font-mono"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveMutation.mutate({ id: report.id, content: editContent, status: "published" })}
                disabled={saveMutation.isPending} className="gap-1">
                <Save className="h-3 w-3" /> 保存并发布
              </Button>
              <Button size="sm" variant="outline" onClick={() => saveMutation.mutate({ id: report.id, content: editContent, status: "draft" })}
                disabled={saveMutation.isPending} className="gap-1">
                保存草稿
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>取消</Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };

  if (isLoading) return <Card><CardContent className="p-6">加载中...</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileBarChart className="h-5 w-5" />
          规划报告 Planning Reports
          <Badge variant="outline">{reports.length} 份报告</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Annual report reminder */}
        {isCounselor && needsAnnualReport && !hasAnnualReport && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span className="text-sm">
                学生注册已满 {daysSinceRegistration} 天，建议生成阶段总结报告
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setActiveTab("annual"); handleGenerate("annual"); }}
              disabled={isGenerating} className="gap-1">
              <Sparkles className="h-3 w-3" /> 生成报告
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="quarterly" className="gap-1">
              <CalendarCheck className="h-3.5 w-3.5" />
              季度评估
              {quarterlyReports.length > 0 && (
                <Badge variant="secondary" className="h-4 min-w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
                  {quarterlyReports.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="annual" className="gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              阶段总结
              {annualReports.length > 0 && (
                <Badge variant="secondary" className="h-4 min-w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
                  {annualReports.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quarterly" className="mt-4 space-y-4">
            {isCounselor && (
              <div className="flex items-center gap-3">
                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUARTER_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => handleGenerate("quarterly")} disabled={isGenerating} className="gap-1">
                  {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  生成季度评估
                </Button>
              </div>
            )}

            {quarterlyReports.length > 0 ? (
              <div className="space-y-4">
                {quarterlyReports.map((r: any) => renderReport(r))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                暂无季度评估报告
              </div>
            )}
          </TabsContent>

          <TabsContent value="annual" className="mt-4 space-y-4">
            {isCounselor && (
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={() => handleGenerate("annual")} disabled={isGenerating} className="gap-1">
                  {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  生成阶段总结
                </Button>
              </div>
            )}

            {annualReports.length > 0 ? (
              <div className="space-y-4">
                {annualReports.map((r: any) => renderReport(r))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                暂无阶段总结报告
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
