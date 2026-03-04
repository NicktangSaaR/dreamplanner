import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Save, Sparkles, FileText, AlertCircle, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useStudentQuarters } from "./hooks/useStudentQuarters";
import { QUARTER_LABELS, QUARTER_DEFAULT_FOCUS } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const PLANNING_SCHEMES = {
  balanced: { label: "均衡发展", description: "学术、活动、竞赛均衡推进" },
  academic: { label: "学术导向", description: "以GPA、AP、标化为核心" },
  activity: { label: "活动导向", description: "以课外活动和领导力为核心" },
  competition: { label: "竞赛导向", description: "以学术竞赛和科研为核心" },
  narrative: { label: "故事线打造", description: "围绕个人叙事主线规划" },
  stem: { label: "STEM专项", description: "针对理工科方向强化" },
  humanities: { label: "人文社科", description: "针对文科方向深耕" },
} as const;

interface KpiItem {
  id: string;
  text: string;
  completed: boolean;
}

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

// Parse KPI string into structured items
const parseKpiItems = (kpiStr: string): KpiItem[] => {
  if (!kpiStr) return [];
  try {
    const parsed = JSON.parse(kpiStr);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fallback: parse from plain text lines
    return kpiStr
      .split('\n')
      .filter(line => line.trim())
      .map((line, i) => ({
        id: `kpi-${Date.now()}-${i}`,
        text: line.replace(/^[•\-\s]+/, '').trim(),
        completed: false,
      }));
  }
  return [];
};

// Serialize KPI items to JSON string for storage
const serializeKpiItems = (items: KpiItem[]): string => {
  return JSON.stringify(items);
};

export default function QuarterEngine({ studentId, currentPhase, readOnly = false }: QuarterEngineProps) {
  const academicYear = getCurrentAcademicYear();
  const { quarters, isLoading, upsertQuarter } = useStudentQuarters(studentId);
  const [activeQuarter, setActiveQuarter] = useState<string>(getCurrentQuarter());
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState<Record<string, { focus: string; kpi: string; risk: string }>>({});
  const [selectedScheme, setSelectedScheme] = useState<string>("balanced");
  const [selectedDocId, setSelectedDocId] = useState<string>("none");

  // KPI editing state
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null);
  const [editingKpiText, setEditingKpiText] = useState("");
  const [newKpiText, setNewKpiText] = useState("");
  const [showNewKpiInput, setShowNewKpiInput] = useState(false);

  const { data: planningDocs = [] } = useQuery({
    queryKey: ["planning-documents", studentId, currentPhase],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_documents")
        .select("id, title, content, file_name")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filter by current phase if available, using raw field access
      const allDocs = data || [];
      if (currentPhase) {
        const phaseDocs = allDocs.filter((d: any) => d.phase === currentPhase);
        if (phaseDocs.length > 0) return phaseDocs;
      }
      return allDocs;
    },
    enabled: !!studentId,
  });

  // Auto-select first phase doc
  useEffect(() => {
    if (planningDocs.length > 0 && selectedDocId === "none") {
      setSelectedDocId(planningDocs[0].id);
    }
  }, [planningDocs]);

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

  const getKpiItems = (quarter: string): KpiItem[] => {
    const data = getQuarterData(quarter);
    return parseKpiItems(data.kpi);
  };

  const updateKpiItems = (quarter: string, items: KpiItem[]) => {
    const serialized = serializeKpiItems(items);
    setFormData(prev => ({
      ...prev,
      [quarter]: { ...getQuarterData(quarter), ...prev[quarter], kpi: serialized },
    }));
  };

  const handleToggleKpi = (quarter: string, kpiId: string) => {
    const items = getKpiItems(quarter);
    const updated = items.map(item =>
      item.id === kpiId ? { ...item, completed: !item.completed } : item
    );
    updateKpiItems(quarter, updated);
  };

  const handleDeleteKpi = (quarter: string, kpiId: string) => {
    const items = getKpiItems(quarter);
    updateKpiItems(quarter, items.filter(item => item.id !== kpiId));
  };

  const handleStartEditKpi = (kpi: KpiItem) => {
    setEditingKpiId(kpi.id);
    setEditingKpiText(kpi.text);
  };

  const handleSaveEditKpi = (quarter: string) => {
    if (!editingKpiText.trim() || !editingKpiId) return;
    const items = getKpiItems(quarter);
    const updated = items.map(item =>
      item.id === editingKpiId ? { ...item, text: editingKpiText.trim() } : item
    );
    updateKpiItems(quarter, updated);
    setEditingKpiId(null);
    setEditingKpiText("");
  };

  const handleAddKpi = (quarter: string) => {
    if (!newKpiText.trim()) return;
    const items = getKpiItems(quarter);
    items.push({
      id: `kpi-${Date.now()}`,
      text: newKpiText.trim(),
      completed: false,
    });
    updateKpiItems(quarter, items);
    setNewKpiText("");
    setShowNewKpiInput(false);
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
      const scheme = PLANNING_SCHEMES[selectedScheme as keyof typeof PLANNING_SCHEMES];
      const selectedDoc = selectedDocId !== "none" ? planningDocs.find(d => d.id === selectedDocId) : null;

      const { data, error } = await supabase.functions.invoke("generate-quarter-plan", {
        body: {
          studentId, quarter, academicYear, currentPhase,
          scheme: selectedScheme, schemeDescription: scheme?.description,
          documentContent: selectedDoc?.content, documentTitle: selectedDoc?.title,
        },
      });
      if (error) throw error;
      if (data?.suggestions) {
        const qData = getQuarterData(quarter);
        // Convert AI KPI suggestions into structured items
        let kpiItems: KpiItem[] = [];
        if (data.suggestions.kpi) {
          let kpiLines: string[] = [];
          if (Array.isArray(data.suggestions.kpi)) {
            kpiLines = data.suggestions.kpi.map((item: any) =>
              typeof item === 'string' ? item : item.title || item.text || JSON.stringify(item)
            );
          } else if (typeof data.suggestions.kpi === 'string') {
            kpiLines = data.suggestions.kpi.split('\n').filter((l: string) => l.trim());
          }
          kpiItems = kpiLines.map((line: string, i: number) => ({
            id: `kpi-ai-${Date.now()}-${i}`,
            text: line.replace(/^[•\-\d.、\s]+/, '').trim(),
            completed: false,
          }));
        }

        upsertQuarter.mutate({
          student_id: studentId,
          quarter,
          academic_year: academicYear,
          quarter_focus: data.suggestions.focus || qData.focus,
          quarter_kpi: kpiItems.length > 0 ? serializeKpiItems(kpiItems) : qData.kpi,
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
            const kpiItems = getKpiItems(q);
            const completedCount = kpiItems.filter(k => k.completed).length;

            return (
              <TabsContent key={q} value={q} className="space-y-4 mt-4">
                {/* Focus */}
                <div className="space-y-2">
                  <Label>季度重点 Focus</Label>
                  <Textarea
                    value={data.focus}
                    onChange={(e) => updateField(q, "focus", e.target.value)}
                    rows={3}
                    disabled={readOnly}
                  />
                </div>

                {/* KPI To-Do List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      季度KPI
                      {kpiItems.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {completedCount}/{kpiItems.length}
                        </Badge>
                      )}
                    </Label>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => setShowNewKpiInput(true)}
                      >
                        <Plus className="h-3 w-3" /> 添加
                      </Button>
                    )}
                  </div>

                  <div className="border rounded-lg divide-y">
                    {kpiItems.length === 0 && !showNewKpiInput && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        暂无KPI，点击添加或使用AI生成
                      </div>
                    )}

                    {kpiItems.map((kpi) => (
                      <div key={kpi.id} className="flex items-center gap-3 px-3 py-2 group hover:bg-muted/50 transition-colors">
                        {editingKpiId === kpi.id ? (
                          <>
                            <Input
                              value={editingKpiText}
                              onChange={(e) => setEditingKpiText(e.target.value)}
                              className="h-8 flex-1 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditKpi(q);
                                if (e.key === 'Escape') { setEditingKpiId(null); setEditingKpiText(""); }
                              }}
                            />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleSaveEditKpi(q)}>
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingKpiId(null); setEditingKpiText(""); }}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Checkbox
                              checked={kpi.completed}
                              onCheckedChange={() => !readOnly && handleToggleKpi(q, kpi.id)}
                              disabled={readOnly}
                            />
                            <span className={`flex-1 text-sm ${kpi.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {kpi.text}
                            </span>
                            {!readOnly && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleStartEditKpi(kpi)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteKpi(q, kpi.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}

                    {/* New KPI input */}
                    {showNewKpiInput && (
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          value={newKpiText}
                          onChange={(e) => setNewKpiText(e.target.value)}
                          placeholder="输入新的KPI..."
                          className="h-8 flex-1 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddKpi(q);
                            if (e.key === 'Escape') { setShowNewKpiInput(false); setNewKpiText(""); }
                          }}
                        />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleAddKpi(q)}>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setShowNewKpiInput(false); setNewKpiText(""); }}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
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
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm whitespace-nowrap"><FileText className="h-3 w-3 inline mr-1" />规划方案</Label>
                        <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="选择规划方案" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs">不使用方案</SelectItem>
                            {planningDocs.map((doc) => (
                              <SelectItem key={doc.id} value={doc.id} className="text-xs">
                                {doc.title || doc.file_name || "未命名方案"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm whitespace-nowrap">规划风格</Label>
                        <Select value={selectedScheme} onValueChange={setSelectedScheme}>
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PLANNING_SCHEMES).map(([key, { label, description }]) => (
                              <SelectItem key={key} value={key} className="text-xs">
                                <span className="font-medium">{label}</span>
                                <span className="text-muted-foreground ml-1">- {description}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {selectedDocId !== "none" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        <FileText className="h-3 w-3" />
                        将基于「{planningDocs.find(d => d.id === selectedDocId)?.title}」的内容生成建议
                      </div>
                    )}
                    {planningDocs.length === 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        暂无已上传的规划方案，请先在规划方案区域上传文档
                      </div>
                    )}
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
