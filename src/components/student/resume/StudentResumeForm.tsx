import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Plus, Trash2, Calendar, Upload, PencilLine, Loader2, Info } from "lucide-react";
import { format } from "date-fns";
import type { ResumeData } from "@/components/admin/resume/types";
import OptimizedResume from "./OptimizedResume";
import {
  ResumeUploadError, emptyResume, loadResumeContext, mergeImported, optimizeResume, prefillFromProfile, uploadAndImport,
  type ResumeContext,
} from "./resumeApi";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type ListKey = "education" | "work_experience" | "activities" | "projects" | "awards";
type Field = { key: string; label: string; kind?: "month" | "text" | "area"; placeholder?: string; wide?: boolean };

const SECTIONS: Record<ListKey, { item: string; add: string; blank: () => Record<string, unknown>; fields: Field[] }> = {
  education: {
    item: "教育经历", add: "添加教育经历",
    blank: () => ({ school: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", description: "" }),
    fields: [
      { key: "school", label: "学校名称 *" }, { key: "degree", label: "学位/学历", placeholder: "如：高中、本科、硕士" },
      { key: "field", label: "专业方向" }, { key: "gpa", label: "GPA", placeholder: "如：3.8/4.0" },
      { key: "startDate", label: "开始时间", kind: "month" }, { key: "endDate", label: "结束时间", kind: "month" },
      { key: "description", label: "描述", kind: "area", placeholder: "相关课程、成就等", wide: true },
    ],
  },
  work_experience: {
    item: "工作/实习经历", add: "添加工作/实习经历",
    blank: () => ({ company: "", position: "", startDate: "", endDate: "", description: "", achievements: [] }),
    fields: [
      { key: "company", label: "公司/组织名称 *" }, { key: "position", label: "职位 *" },
      { key: "startDate", label: "开始时间", kind: "month" }, { key: "endDate", label: "结束时间", kind: "month" },
      { key: "description", label: "工作内容与成果", kind: "area", placeholder: "每行一条：做了什么、结果如何（尽量有数字）", wide: true },
    ],
  },
  activities: {
    item: "课外活动", add: "添加课外活动",
    blank: () => ({ name: "", role: "", startDate: "", endDate: "", description: "" }),
    fields: [
      { key: "name", label: "活动名称 *", placeholder: "活动/组织名称" }, { key: "role", label: "角色/职位" },
      { key: "startDate", label: "开始时间", kind: "month" }, { key: "endDate", label: "结束时间", kind: "month" },
      { key: "description", label: "活动描述", kind: "area", placeholder: "描述您的参与和贡献…", wide: true },
    ],
  },
  projects: {
    item: "科研/项目经历", add: "添加科研/项目经历",
    blank: () => ({ name: "", role: "", startDate: "", endDate: "", description: "", technologies: [] }),
    fields: [
      { key: "name", label: "项目名称 *" }, { key: "role", label: "角色" },
      { key: "startDate", label: "开始时间", kind: "month" }, { key: "endDate", label: "结束时间", kind: "month" },
      { key: "description", label: "内容与成果", kind: "area", placeholder: "研究问题、方法、你的贡献、产出（论文/报告/获奖）", wide: true },
    ],
  },
  awards: {
    item: "奖项/荣誉", add: "添加奖项/荣誉",
    blank: () => ({ name: "", issuer: "", date: "", description: "" }),
    fields: [
      { key: "name", label: "奖项名称 *" }, { key: "issuer", label: "颁发机构" }, { key: "date", label: "获得时间", kind: "month" },
      { key: "description", label: "描述（可选）", kind: "area", wide: true },
    ],
  },
};

const IMPORT_STEPS = ["上传文件", "读取简历内容", "保存到简历信息", "生成优化版"];

/**
 * Resume. Without `studentId` the signed-in student edits their own; with
 * `studentId` the student's team (lead counselor, follow-up teacher, admin)
 * works on it. Two ways in: fill the form (personal info is read from the
 * student's profile), or upload an existing resume, which is read into the
 * form, saved, and polished by AI. Graduate applicants have no
 * extracurricular-activities section.
 */
export default function StudentResumeForm({ studentId }: { studentId?: string } = {}) {
  const queryClient = useQueryClient();
  const teamMode = !!studentId;
  const fileRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ResumeData>(emptyResume());
  const [started, setStarted] = useState(false);
  const [prefilled, setPrefilled] = useState<string[]>([]);
  const [importStep, setImportStep] = useState<number | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [tab, setTab] = useState("personal");

  const { data: target } = useQuery({
    queryKey: ["resume-target", studentId ?? "me"],
    queryFn: async () => studentId || (await supabase.auth.getUser()).data.user?.id || null,
  });

  const { data: ctx } = useQuery({
    queryKey: ["resume-context", target],
    queryFn: () => loadResumeContext(target as string),
    enabled: !!target,
  });
  const graduate = ctx?.applicantType === "graduate";

  const { data: request, isLoading: loadingRequest } = useQuery({
    queryKey: ["my-resume-request", target],
    queryFn: async () => {
      const { data, error } = await db
        .from("resume_requests").select("*").eq("student_id", target)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data as { id: string; status: string; due_date: string | null; message: string | null } | null;
    },
    enabled: !!target,
  });

  const { data: existing, isLoading: loadingData } = useQuery({
    queryKey: ["my-resume-data", request?.id],
    queryFn: async () => {
      const { data, error } = await db.from("resume_data").select("*").eq("request_id", request!.id).maybeSingle();
      if (error) throw error;
      return data as (ResumeData & { id: string }) | null;
    },
    enabled: !!request,
  });

  useEffect(() => {
    if (!existing) return;
    const base = emptyResume();
    setFormData({
      ...base,
      ...Object.fromEntries(Object.entries(existing).filter(([k, v]) => k in base && v != null)),
    } as ResumeData);
    setStarted(true);
  }, [existing]);

  const requestIdRef = useRef<string | null>(null);
  const ensureRequest = async (): Promise<string> => {
    if (request) return request.id;
    if (requestIdRef.current) return requestIdRef.current;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !target) throw new Error("未登录");
    const { data, error } = await db
      .from("resume_requests")
      .insert({ student_id: target, admin_id: teamMode ? auth.user.id : null, status: "pending" })
      .select("id").single();
    if (error) throw error;
    requestIdRef.current = data.id as string;
    await queryClient.invalidateQueries({ queryKey: ["my-resume-request", target] });
    return data.id as string;
  };

  /** Write the form (plus any extra columns) to resume_data; returns the row id. */
  const persist = async (data: ResumeData, extra: Record<string, unknown> = {}) => {
    const requestId = await ensureRequest();
    const row = {
      request_id: requestId, student_id: target,
      full_name: data.full_name, email: data.email, phone: data.phone, address: data.address,
      linkedin_url: data.linkedin_url, personal_website: data.personal_website,
      education: data.education, work_experience: data.work_experience,
      activities: graduate ? [] : data.activities, awards: data.awards, skills: data.skills,
      certifications: data.certifications, projects: data.projects, languages: data.languages,
      ...extra,
    };
    const { data: current } = await db.from("resume_data").select("id").eq("request_id", requestId).maybeSingle();
    const { error } = current
      ? await db.from("resume_data").update(row).eq("id", current.id)
      : await db.from("resume_data").insert(row);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["my-resume-data"] });
    return requestId;
  };

  const saveMutation = useMutation({
    mutationFn: async (submit: boolean) => {
      const requestId = await persist(formData);
      if (submit && (request?.status ?? "pending") === "pending") {
        const { error } = await db.from("resume_requests").update({ status: "submitted" }).eq("id", requestId);
        if (error) throw error;
      }
    },
    onSuccess: (_, submit) => {
      queryClient.invalidateQueries({ queryKey: ["my-resume-request", target] });
      toast.success(submit ? "简历信息已提交" : "已保存");
    },
    onError: (e: Error) => toast.error("保存失败：" + e.message),
  });

  const runOptimize = async (data: ResumeData, context: ResumeContext, language: "en" | "zh") => {
    setOptimizing(true);
    try {
      const md = await optimizeResume(data, context, language);
      const requestId = await persist(data, { generated_resume: md });
      if (teamMode) await db.from("resume_requests").update({ status: "generated" }).eq("id", requestId);
      queryClient.invalidateQueries({ queryKey: ["my-resume-request", target] });
      return true;
    } catch (e) {
      toast.error("优化失败：" + (e instanceof Error ? e.message : ""));
      return false;
    } finally {
      setOptimizing(false);
    }
  };

  const startFill = () => {
    if (!ctx) return;
    const { form, filled } = prefillFromProfile(formData, ctx);
    setFormData(form);
    setPrefilled(filled);
    setStarted(true);
  };

  const onFile = async (file: File | undefined) => {
    if (!file || !target || !ctx) return;
    try {
      setImportStep(0);
      const stepTimer = setTimeout(() => setImportStep(1), 1200);
      const { path, data } = await uploadAndImport(target, file, ctx);
      clearTimeout(stepTimer);
      setImportStep(2);
      const base = prefillFromProfile(formData, ctx).form;
      const merged = mergeImported(base, data);
      setFormData(merged);
      setPrefilled([]);
      setStarted(true);
      await persist(merged, { uploaded_file_path: path });
      setImportStep(3);
      const ok = await runOptimize(merged, ctx, "en");
      toast.success(ok ? "简历已读取、保存并生成优化版，请核对各栏信息" : "简历已读取并保存，请核对各栏信息");
    } catch (e) {
      const code = e instanceof ResumeUploadError ? e.message : "";
      toast.error(
        code === "type" ? "请上传 PDF、Word（.docx）或文本文件"
          : code === "size" ? "文件不能超过 10MB"
            : code === "empty" ? "没有读到文字内容，请换一个文件，或改用在线填写"
              : "读取简历失败，请稍后再试，或改用在线填写",
      );
    } finally {
      setImportStep(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateItem = (key: ListKey, index: number, field: string, value: string) => {
    const list = [...(formData[key] as unknown as Record<string, unknown>[])];
    list[index] = { ...list[index], [field]: value };
    setFormData({ ...formData, [key]: list });
  };
  const addItem = (key: ListKey) =>
    setFormData({ ...formData, [key]: [...(formData[key] as unknown[]), SECTIONS[key].blank()] });
  const removeItem = (key: keyof ResumeData, index: number) =>
    setFormData({ ...formData, [key]: (formData[key] as unknown[]).filter((_, i) => i !== index) });

  if (loadingRequest || (request && loadingData) || !ctx) {
    return <div className="py-8 text-center text-sm text-muted-foreground">加载中…</div>;
  }

  const fileInput = (
    <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
      className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
  );

  if (importStep !== null) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8">
          {IMPORT_STEPS.map((s, i) => (
            <p key={s} className={`flex items-center gap-2 text-sm ${i > importStep ? "text-muted-foreground/60" : i < importStep ? "text-muted-foreground" : "font-medium"}`}>
              {i === importStep ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <span className={`h-2 w-2 rounded-full ${i < importStep ? "bg-primary" : "bg-muted-foreground/30"} mx-1`} />}
              {s}{i < importStep ? " ✓" : ""}
            </p>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!started) {
    return (
      <div className="space-y-4">
        {fileInput}
        {request?.message && <p className="text-sm text-muted-foreground">备注：{request.message}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <button type="button" onClick={startFill}
            className="rounded-lg border bg-card p-5 text-left transition hover:border-primary/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <PencilLine className="mb-3 h-6 w-6 text-primary" />
            <p className="font-medium">在线填写</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {teamMode ? "老师代填或和学生一起填。" : "一步步填写经历。"}姓名、邮箱、学校等已有信息会自动读取。
            </p>
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="rounded-lg border bg-card p-5 text-left transition hover:border-primary/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Upload className="mb-3 h-6 w-6 text-primary" />
            <p className="font-medium">上传已有简历</p>
            <p className="mt-1 text-sm text-muted-foreground">PDF 或 Word。系统自动读取内容、保存到各栏，并生成优化版。</p>
          </button>
        </div>
      </div>
    );
  }

  const listTab = (key: ListKey) => {
    const sec = SECTIONS[key];
    const list = formData[key] as unknown as Record<string, unknown>[];
    return (
      <TabsContent value={key}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            {list.map((item, index) => (
              <div key={index} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{sec.item} {index + 1}</h4>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(key, index)} aria-label={`删除${sec.item} ${index + 1}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {sec.fields.map((f) => (
                    <div key={f.key} className={`space-y-2 ${f.wide ? "md:col-span-2" : ""}`}>
                      <Label>{f.label}</Label>
                      {f.kind === "area" ? (
                        <Textarea rows={3} value={String(item[f.key] ?? "")} placeholder={f.placeholder}
                          onChange={(e) => updateItem(key, index, f.key, e.target.value)} />
                      ) : (
                        <Input value={String(item[f.key] ?? "")} placeholder={f.kind === "month" ? (f.key === "endDate" ? "如：2024-06 或 至今" : "如：2021-09") : f.placeholder}
                          onChange={(e) => updateItem(key, index, f.key, e.target.value)} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addItem(key)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />{sec.add}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    );
  };

  const personal: { key: keyof ResumeData; label: string; placeholder: string; type?: string }[] = [
    { key: "full_name", label: "姓名 *", placeholder: "请输入姓名" },
    { key: "email", label: "邮箱 *", placeholder: "请输入邮箱", type: "email" },
    { key: "phone", label: "电话", placeholder: "请输入电话号码" },
    { key: "address", label: "所在城市/地址", placeholder: "如：Vancouver, BC" },
    { key: "linkedin_url", label: "LinkedIn", placeholder: "LinkedIn 个人主页链接" },
    { key: "personal_website", label: "个人网站", placeholder: "个人网站链接" },
  ];

  return (
    <div className="space-y-6">
      {fileInput}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>简历信息</CardTitle>
              <CardDescription>
                {graduate ? "研究生申请简历：重点写工作/实习、科研和项目经历。" : "填写或核对以下信息，用于生成专业简历。"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" />上传简历重新读取
              </Button>
              {request && (
                <Badge variant={request.status === "pending" ? "secondary" : "default"}>
                  {request.status === "pending" ? "待填写" : request.status === "submitted" ? "已提交" : "已生成"}
                </Badge>
              )}
            </div>
          </div>
          {request?.due_date && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />截止日期：{format(new Date(request.due_date), "yyyy年MM月dd日")}
            </div>
          )}
          {request?.message && <p className="mt-2 text-sm text-muted-foreground">备注：{request.message}</p>}
          {prefilled.length > 0 && (
            <p className="mt-2 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-primary" />已从学生资料自动读取姓名、邮箱、学校等信息，请核对后补充其余内容。
            </p>
          )}
        </CardHeader>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="h-auto w-full flex-wrap">
          <TabsTrigger value="personal">个人信息</TabsTrigger>
          <TabsTrigger value="education">教育背景</TabsTrigger>
          <TabsTrigger value="work_experience">工作/实习</TabsTrigger>
          {graduate ? <TabsTrigger value="projects">科研/项目</TabsTrigger> : <TabsTrigger value="activities">课外活动</TabsTrigger>}
          {!graduate && <TabsTrigger value="projects">科研/项目</TabsTrigger>}
          <TabsTrigger value="awards">奖项荣誉</TabsTrigger>
          <TabsTrigger value="skills">技能语言</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
              {personal.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label>{f.label}</Label>
                  <Input type={f.type || "text"} value={String(formData[f.key] ?? "")} placeholder={f.placeholder}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {listTab("education")}
        {listTab("work_experience")}
        {!graduate && listTab("activities")}
        {listTab("projects")}
        {listTab("awards")}

        <TabsContent value="skills">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label>技能（用逗号分隔）</Label>
                <Textarea rows={2} value={formData.skills.join(", ")} placeholder="如：Python, Excel, 数据分析, 项目管理"
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div className="space-y-2">
                <Label>语言能力</Label>
                {formData.languages.map((lang, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input placeholder="语言" value={lang.language} onChange={(e) => {
                      const next = [...formData.languages]; next[index] = { ...next[index], language: e.target.value };
                      setFormData({ ...formData, languages: next });
                    }} />
                    <Input placeholder="水平" value={lang.proficiency} onChange={(e) => {
                      const next = [...formData.languages]; next[index] = { ...next[index], proficiency: e.target.value };
                      setFormData({ ...formData, languages: next });
                    }} />
                    <Button variant="ghost" size="sm" onClick={() => removeItem("languages", index)} aria-label="删除语言"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setFormData({ ...formData, languages: [...formData.languages, { language: "", proficiency: "" }] })}>
                  <Plus className="mr-2 h-4 w-4" />添加语言
                </Button>
              </div>
              <div className="space-y-2">
                <Label>{graduate ? "证书与考试（用逗号分隔）" : "证书（用逗号分隔）"}</Label>
                <Textarea rows={2} value={formData.certifications.join(", ")}
                  placeholder={graduate ? "如：GMAT 720, TOEFL 108, CFA Level I" : "如：AWS 认证"}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => saveMutation.mutate(false)} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />保存
        </Button>
        {!teamMode && (request?.status ?? "pending") === "pending" && (
          <Button onClick={() => saveMutation.mutate(true)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "提交中…" : "提交给老师"}
          </Button>
        )}
      </div>

      <OptimizedResume
        markdown={existing?.generated_resume || ""}
        busy={optimizing}
        onOptimize={(language) => void runOptimize(formData, ctx, language)}
        onSave={async (md) => {
          try {
            await persist(formData, { generated_resume: md });
            toast.success("已保存");
          } catch (e) {
            toast.error("保存失败：" + (e instanceof Error ? e.message : ""));
          }
        }}
        fileName={`${formData.full_name || "Resume"} Resume`}
        originalPath={existing?.uploaded_file_path || null}
      />
    </div>
  );
}
