import { useState, useEffect } from "react";
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
import { Save, Plus, Trash2, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ResumeData, Education, WorkExperience, Activity, Award } from "@/components/admin/resume/types";

export default function StudentResumeForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ResumeData>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    linkedin_url: "",
    personal_website: "",
    education: [],
    work_experience: [],
    activities: [],
    awards: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
  });

  // Fetch pending resume request
  const { data: pendingRequest, isLoading: isLoadingRequest } = useQuery({
    queryKey: ["my-resume-request"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("未登录");
      
      const { data, error } = await supabase
        .from("resume_requests")
        .select("*")
        .eq("student_id", userData.user.id)
        .in("status", ["pending", "submitted"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  // Fetch existing resume data
  const { data: existingData } = useQuery({
    queryKey: ["my-resume-data", pendingRequest?.id],
    queryFn: async () => {
      if (!pendingRequest) return null;
      
      const { data, error } = await supabase
        .from("resume_data")
        .select("*")
        .eq("request_id", pendingRequest.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!pendingRequest,
  });

  // Load existing data into form
  useEffect(() => {
    if (existingData) {
      setFormData({
        ...formData,
        full_name: existingData.full_name || "",
        email: existingData.email || "",
        phone: existingData.phone || "",
        address: existingData.address || "",
        linkedin_url: existingData.linkedin_url || "",
        personal_website: existingData.personal_website || "",
        education: (existingData.education as unknown as Education[]) || [],
        work_experience: (existingData.work_experience as unknown as WorkExperience[]) || [],
        activities: (existingData.activities as unknown as Activity[]) || [],
        awards: (existingData.awards as unknown as Award[]) || [],
        skills: (existingData.skills as unknown as string[]) || [],
        certifications: (existingData.certifications as unknown as string[]) || [],
        projects: (existingData.projects as unknown as ResumeData['projects']) || [],
        languages: (existingData.languages as unknown as ResumeData['languages']) || [],
      });
    }
  }, [existingData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (submit: boolean) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !pendingRequest) throw new Error("无效请求");
      
      // Convert to JSON-compatible format for Supabase
      const dataToSave = {
        request_id: pendingRequest.id,
        student_id: userData.user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        linkedin_url: formData.linkedin_url,
        personal_website: formData.personal_website,
        education: JSON.parse(JSON.stringify(formData.education)),
        work_experience: JSON.parse(JSON.stringify(formData.work_experience)),
        activities: JSON.parse(JSON.stringify(formData.activities)),
        awards: JSON.parse(JSON.stringify(formData.awards)),
        skills: JSON.parse(JSON.stringify(formData.skills)),
        certifications: JSON.parse(JSON.stringify(formData.certifications)),
        projects: JSON.parse(JSON.stringify(formData.projects)),
        languages: JSON.parse(JSON.stringify(formData.languages)),
      };
      
      if (existingData) {
        const { error } = await supabase
          .from("resume_data")
          .update(dataToSave)
          .eq("id", existingData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("resume_data")
          .insert(dataToSave);
        if (error) throw error;
      }
      
      if (submit) {
        const { error } = await supabase
          .from("resume_requests")
          .update({ status: "submitted" })
          .eq("id", pendingRequest.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, submit) => {
      queryClient.invalidateQueries({ queryKey: ["my-resume-data"] });
      queryClient.invalidateQueries({ queryKey: ["my-resume-request"] });
      toast.success(submit ? "简历信息已提交" : "保存成功");
    },
    onError: (error) => {
      toast.error("保存失败: " + error.message);
    },
  });

  // Array field helpers
  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { school: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", description: "" }],
    });
  };

  const addWorkExperience = () => {
    setFormData({
      ...formData,
      work_experience: [...formData.work_experience, { company: "", position: "", startDate: "", endDate: "", description: "", achievements: [] }],
    });
  };

  const addActivity = () => {
    setFormData({
      ...formData,
      activities: [...formData.activities, { name: "", role: "", startDate: "", endDate: "", description: "" }],
    });
  };

  const addAward = () => {
    setFormData({
      ...formData,
      awards: [...formData.awards, { name: "", issuer: "", date: "", description: "" }],
    });
  };

  const removeItem = (field: keyof ResumeData, index: number) => {
    const arr = formData[field] as any[];
    setFormData({
      ...formData,
      [field]: arr.filter((_, i) => i !== index),
    });
  };

  const updateArrayField = <T,>(field: keyof ResumeData, index: number, updates: Partial<T>) => {
    const arr = [...(formData[field] as T[])];
    arr[index] = { ...arr[index], ...updates };
    setFormData({ ...formData, [field]: arr });
  };

  if (isLoadingRequest) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (!pendingRequest) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>暂无待填写的简历信息表</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>填写简历信息</CardTitle>
              <CardDescription>
                请完整填写以下信息，用于生成专业简历
              </CardDescription>
            </div>
            <Badge variant={pendingRequest.status === "submitted" ? "default" : "secondary"}>
              {pendingRequest.status === "submitted" ? "已提交" : "待填写"}
            </Badge>
          </div>
          {pendingRequest.due_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Calendar className="h-4 w-4" />
              截止日期: {format(new Date(pendingRequest.due_date), "yyyy年MM月dd日")}
            </div>
          )}
          {pendingRequest.message && (
            <p className="text-sm text-muted-foreground mt-2">备注: {pendingRequest.message}</p>
          )}
        </CardHeader>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="personal">个人信息</TabsTrigger>
          <TabsTrigger value="education">教育背景</TabsTrigger>
          <TabsTrigger value="experience">工作经历</TabsTrigger>
          <TabsTrigger value="activities">课外活动</TabsTrigger>
          <TabsTrigger value="awards">奖项荣誉</TabsTrigger>
          <TabsTrigger value="skills">技能语言</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>姓名 *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="请输入姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label>邮箱 *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="请输入邮箱"
                  />
                </div>
                <div className="space-y-2">
                  <Label>电话</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入电话号码"
                  />
                </div>
                <div className="space-y-2">
                  <Label>地址</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="请输入地址"
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    placeholder="LinkedIn个人主页URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label>个人网站</Label>
                  <Input
                    value={formData.personal_website}
                    onChange={(e) => setFormData({ ...formData, personal_website: e.target.value })}
                    placeholder="个人网站URL"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {formData.education.map((edu, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">教育经历 {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeItem("education", index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>学校名称 *</Label>
                      <Input
                        value={edu.school}
                        onChange={(e) => updateArrayField<Education>("education", index, { school: e.target.value })}
                        placeholder="学校名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>学位/学历</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateArrayField<Education>("education", index, { degree: e.target.value })}
                        placeholder="如: 高中、本科"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>专业方向</Label>
                      <Input
                        value={edu.field}
                        onChange={(e) => updateArrayField<Education>("education", index, { field: e.target.value })}
                        placeholder="专业方向"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>GPA</Label>
                      <Input
                        value={edu.gpa || ""}
                        onChange={(e) => updateArrayField<Education>("education", index, { gpa: e.target.value })}
                        placeholder="如: 3.8/4.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>开始时间</Label>
                      <Input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateArrayField<Education>("education", index, { startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>结束时间</Label>
                      <Input
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => updateArrayField<Education>("education", index, { endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>描述</Label>
                    <Textarea
                      value={edu.description || ""}
                      onChange={(e) => updateArrayField<Education>("education", index, { description: e.target.value })}
                      placeholder="相关课程、成就等"
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addEducation} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                添加教育经历
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experience">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {formData.work_experience.map((exp, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">工作/实习经历 {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeItem("work_experience", index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>公司/组织名称 *</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateArrayField<WorkExperience>("work_experience", index, { company: e.target.value })}
                        placeholder="公司名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>职位 *</Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => updateArrayField<WorkExperience>("work_experience", index, { position: e.target.value })}
                        placeholder="职位名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>开始时间</Label>
                      <Input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateArrayField<WorkExperience>("work_experience", index, { startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>结束时间</Label>
                      <Input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => updateArrayField<WorkExperience>("work_experience", index, { endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>工作描述</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => updateArrayField<WorkExperience>("work_experience", index, { description: e.target.value })}
                      placeholder="描述您的职责和成就..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addWorkExperience} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                添加工作/实习经历
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {formData.activities.map((activity, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">课外活动 {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeItem("activities", index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>活动名称 *</Label>
                      <Input
                        value={activity.name}
                        onChange={(e) => updateArrayField<Activity>("activities", index, { name: e.target.value })}
                        placeholder="活动/组织名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>角色/职位</Label>
                      <Input
                        value={activity.role}
                        onChange={(e) => updateArrayField<Activity>("activities", index, { role: e.target.value })}
                        placeholder="您在活动中的角色"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>开始时间</Label>
                      <Input
                        type="month"
                        value={activity.startDate}
                        onChange={(e) => updateArrayField<Activity>("activities", index, { startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>结束时间</Label>
                      <Input
                        type="month"
                        value={activity.endDate}
                        onChange={(e) => updateArrayField<Activity>("activities", index, { endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>活动描述</Label>
                    <Textarea
                      value={activity.description}
                      onChange={(e) => updateArrayField<Activity>("activities", index, { description: e.target.value })}
                      placeholder="描述您的参与和贡献..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addActivity} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                添加课外活动
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="awards">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {formData.awards.map((award, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">奖项/荣誉 {index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeItem("awards", index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>奖项名称 *</Label>
                      <Input
                        value={award.name}
                        onChange={(e) => updateArrayField<Award>("awards", index, { name: e.target.value })}
                        placeholder="奖项名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>颁发机构</Label>
                      <Input
                        value={award.issuer}
                        onChange={(e) => updateArrayField<Award>("awards", index, { issuer: e.target.value })}
                        placeholder="颁发机构"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>获得时间</Label>
                      <Input
                        type="month"
                        value={award.date}
                        onChange={(e) => updateArrayField<Award>("awards", index, { date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>描述（可选）</Label>
                    <Textarea
                      value={award.description || ""}
                      onChange={(e) => updateArrayField<Award>("awards", index, { description: e.target.value })}
                      placeholder="奖项描述..."
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addAward} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                添加奖项/荣誉
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>技能（用逗号分隔）</Label>
                <Textarea
                  value={formData.skills.join(", ")}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  placeholder="如: Python, JavaScript, 数据分析, 项目管理"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>语言能力</Label>
                {formData.languages.map((lang, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="语言"
                      value={lang.language}
                      onChange={(e) => {
                        const newLangs = [...formData.languages];
                        newLangs[index] = { ...newLangs[index], language: e.target.value };
                        setFormData({ ...formData, languages: newLangs });
                      }}
                    />
                    <Input
                      placeholder="水平"
                      value={lang.proficiency}
                      onChange={(e) => {
                        const newLangs = [...formData.languages];
                        newLangs[index] = { ...newLangs[index], proficiency: e.target.value };
                        setFormData({ ...formData, languages: newLangs });
                      }}
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeItem("languages", index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, languages: [...formData.languages, { language: "", proficiency: "" }] })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  添加语言
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>证书（用逗号分隔）</Label>
                <Textarea
                  value={formData.certifications.join(", ")}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  placeholder="如: AWS认证, Google Analytics认证"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => saveMutation.mutate(false)}
          disabled={saveMutation.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          保存草稿
        </Button>
        <Button
          onClick={() => saveMutation.mutate(true)}
          disabled={saveMutation.isPending || pendingRequest.status === "submitted"}
        >
          {saveMutation.isPending ? "提交中..." : "提交信息"}
        </Button>
      </div>
    </div>
  );
}
