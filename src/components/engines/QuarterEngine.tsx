import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Save, Sparkles } from "lucide-react";
import { useStudentQuarters } from "./hooks/useStudentQuarters";
import { QUARTER_LABELS, QUARTER_DEFAULT_FOCUS } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuarterEngineProps {
  studentId: string;
  currentPhase?: string;
  readOnly?: boolean;
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

export default function QuarterEngine({ studentId, currentPhase, readOnly = false }: QuarterEngineProps) {
  const academicYear = getCurrentAcademicYear();
  const { quarters, isLoading, upsertQuarter } = useStudentQuarters(studentId);
  const [activeQuarter, setActiveQuarter] = useState<string>(getCurrentQuarter());
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState<Record<string, { focus: string; kpi: string; risk: string }>>({});

  const getQuarterData = (q: string) => {
    const saved = quarters.find(sq => sq.quarter === q && sq.academic_year === academicYear);
    const form = formData[q];
    return {
      focus: form?.focus ?? saved?.quarter_focus ?? QUARTER_DEFAULT_FOCUS[q] ?? "",
      kpi: form?.kpi ?? saved?.quarter_kpi ?? "",
      risk: form?.risk ?? saved?.quarter_risk ?? "",
      suggestions: saved?.auto_suggestions || [],
    };
  };

  const updateField = (quarter: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [quarter]: { ...getQuarterData(quarter), ...prev[quarter], [field]: value },
    }));
  };

  const handleSave = (quarter: string) => {
    const data = getQuarterData(quarter);
    upsertQuarter.mutate({
      student_id: studentId,
      quarter,
      academic_year: academicYear,
      quarter_focus: data.focus,
      quarter_kpi: data.kpi,
      quarter_risk: data.risk,
    });
  };

  const handleGenerateSuggestions = async (quarter: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quarter-plan", {
        body: { studentId, quarter, academicYear, currentPhase },
      });
      if (error) throw error;
      if (data?.suggestions) {
        const qData = getQuarterData(quarter);
        upsertQuarter.mutate({
          student_id: studentId,
          quarter,
          academic_year: academicYear,
          quarter_focus: data.suggestions.focus || qData.focus,
          quarter_kpi: data.suggestions.kpi || qData.kpi,
          quarter_risk: data.suggestions.risk || qData.risk,
          auto_suggestions: data.suggestions.items || [],
        });
      }
      toast.success("AI建议已生成");
    } catch (err: any) {
      toast.error(`生成失败: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) return <Card><CardContent className="p-6">加载中...</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          季度节奏引擎 Quarter Engine
          <Badge variant="outline">{academicYear}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeQuarter} onValueChange={setActiveQuarter}>
          <TabsList className="grid grid-cols-4 w-full">
            {Object.entries(QUARTER_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {label}
                {key === getCurrentQuarter() && <span className="ml-1 text-primary">●</span>}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.keys(QUARTER_LABELS).map((q) => {
            const data = getQuarterData(q);
            return (
              <TabsContent key={q} value={q} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>季度重点 Focus</Label>
                    <Textarea
                      value={data.focus}
                      onChange={(e) => updateField(q, "focus", e.target.value)}
                      rows={3}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>季度KPI</Label>
                    <Textarea
                      value={data.kpi}
                      onChange={(e) => updateField(q, "kpi", e.target.value)}
                      rows={3}
                      disabled={readOnly}
                      placeholder="例：完成2个AP报名，1个竞赛提交"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>风险评估 Risk</Label>
                    <Textarea
                      value={data.risk}
                      onChange={(e) => updateField(q, "risk", e.target.value)}
                      rows={3}
                      disabled={readOnly}
                      placeholder="潜在风险和应对方案"
                    />
                  </div>
                </div>

                {data.suggestions.length > 0 && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">🤖 AI 建议</p>
                    <ul className="text-sm space-y-1">
                      {data.suggestions.map((s: any, i: number) => (
                        <li key={i}>• {typeof s === "string" ? s : s.title || JSON.stringify(s)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!readOnly && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleSave(q)} disabled={upsertQuarter.isPending} size="sm" className="gap-1">
                      <Save className="h-3 w-3" /> 保存
                    </Button>
                    <Button 
                      onClick={() => handleGenerateSuggestions(q)} 
                      disabled={isGenerating} 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                    >
                      <Sparkles className="h-3 w-3" /> AI生成建议
                    </Button>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
