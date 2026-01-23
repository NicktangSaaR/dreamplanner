import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Save, Copy, Check } from "lucide-react";
import { ResumeRequest, ResumeData } from "./types";
import ReactMarkdown from "react-markdown";

interface ResumePreviewDialogProps {
  request: ResumeRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ResumePreviewDialog({ request, open, onOpenChange }: ResumePreviewDialogProps) {
  const [editedResume, setEditedResume] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  // Fetch resume data
  const { data: resumeData, isLoading } = useQuery({
    queryKey: ["resume-data", request.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resume_data")
        .select("*")
        .eq("request_id", request.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      if (data?.generated_resume) {
        setEditedResume(data.generated_resume);
      }
      // Cast JSON fields to proper types
      if (data) {
        return {
          ...data,
          education: (data.education || []) as unknown as ResumeData['education'],
          work_experience: (data.work_experience || []) as unknown as ResumeData['work_experience'],
          activities: (data.activities || []) as unknown as ResumeData['activities'],
          awards: (data.awards || []) as unknown as ResumeData['awards'],
          skills: (data.skills || []) as unknown as ResumeData['skills'],
          certifications: (data.certifications || []) as unknown as ResumeData['certifications'],
          projects: (data.projects || []) as unknown as ResumeData['projects'],
          languages: (data.languages || []) as unknown as ResumeData['languages'],
        } as ResumeData;
      }
      return null;
    },
    enabled: open,
  });

  // Generate resume mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!resumeData) throw new Error("没有简历数据");
      
      const { data, error } = await supabase.functions.invoke("generate-resume", {
        body: { resumeData },
      });
      
      if (error) throw error;
      return data.resume;
    },
    onSuccess: async (generatedResume) => {
      setEditedResume(generatedResume);
      
      // Save to database
      await supabase
        .from("resume_data")
        .update({ generated_resume: generatedResume })
        .eq("request_id", request.id);
      
      // Update request status
      await supabase
        .from("resume_requests")
        .update({ status: "generated" })
        .eq("id", request.id);
      
      queryClient.invalidateQueries({ queryKey: ["resume-data", request.id] });
      queryClient.invalidateQueries({ queryKey: ["resume-requests"] });
      
      toast.success("简历生成成功！");
    },
    onError: (error) => {
      toast.error("生成失败: " + error.message);
    },
  });

  // Save edited resume
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("resume_data")
        .update({ generated_resume: editedResume })
        .eq("request_id", request.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-data", request.id] });
      toast.success("保存成功");
    },
    onError: () => {
      toast.error("保存失败");
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>简历预览 - {request.student?.full_name}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">加载中...</div>
        ) : !resumeData ? (
          <div className="py-8 text-center text-muted-foreground">学生尚未填写简历信息</div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {generateMutation.isPending ? "生成中..." : "AI生成简历"}
              </Button>
              {editedResume && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    保存修改
                  </Button>
                  <Button variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? "已复制" : "复制"}
                  </Button>
                </>
              )}
            </div>
            
            <Tabs defaultValue="preview" className="w-full">
              <TabsList>
                <TabsTrigger value="preview">预览</TabsTrigger>
                <TabsTrigger value="edit">编辑</TabsTrigger>
                <TabsTrigger value="data">原始数据</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview">
                <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                  {editedResume ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{editedResume}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      点击"AI生成简历"按钮生成简历
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="edit">
                <Textarea
                  value={editedResume}
                  onChange={(e) => setEditedResume(e.target.value)}
                  placeholder="生成的简历将显示在这里，您可以编辑..."
                  className="h-[500px] font-mono text-sm"
                />
              </TabsContent>
              
              <TabsContent value="data">
                <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(resumeData, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
