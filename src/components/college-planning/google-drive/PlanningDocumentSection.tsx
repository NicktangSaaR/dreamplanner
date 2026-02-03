import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { 
  FileText, 
  Upload, 
  Loader2, 
  Sparkles, 
  Trash2,
  AlertCircle,
  FileUp,
  Download
} from "lucide-react";
import PlanningMilestones from "./PlanningMilestones";

interface PlanningDocumentSectionProps {
  studentId: string;
}

interface PlanningDocument {
  id: string;
  title: string;
  content: string;
  file_path: string | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}

export default function PlanningDocumentSection({ studentId }: PlanningDocumentSectionProps) {
  const [document, setDocument] = useState<PlanningDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [milestonesRefresh, setMilestonesRefresh] = useState(0);
  const { toast } = useToast();
  const { profile } = useProfile();

  const isCounselor = profile?.user_type === 'counselor' || profile?.user_type === 'admin';

  // Load existing document
  useEffect(() => {
    loadDocument();
  }, [studentId]);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('planning_documents')
        .select('id, title, google_doc_id, file_path, file_name, content, created_at, updated_at')
        .eq('student_id', studentId)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDocument({
          id: data.id,
          title: data.title,
          content: data.content || data.google_doc_id || "",
          file_path: data.file_path,
          file_name: data.file_name,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } else {
        setDocument(null);
      }
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain', // .txt
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "不支持的文件格式",
        description: "请上传 .docx 或 .txt 文件",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "文件过大",
        description: "文件大小不能超过 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('planning-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("文件上传失败: " + uploadError.message);
      }

      toast({
        title: "文件上传成功",
        description: "正在解析文档内容...",
      });

      // Parse the document to extract text
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-document', {
        body: {
          filePath: fileName,
          studentId: studentId,
        },
      });

      if (parseError) {
        console.error("Parse error:", parseError);
        throw new Error("文档解析失败");
      }

      if (parseData?.error) {
        throw new Error(parseData.error);
      }

      const extractedContent = parseData?.content || "";

      // Save or update document record
      if (document) {
        // Delete old file if exists
        if (document.file_path) {
          await supabase.storage
            .from('planning-documents')
            .remove([document.file_path]);
        }

        // Update existing document
        const { error: updateError } = await supabase
          .from('planning_documents')
          .update({
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            file_path: fileName,
            file_name: file.name,
            content: extractedContent,
            google_doc_id: extractedContent, // Keep for backwards compatibility
            updated_at: new Date().toISOString(),
          })
          .eq('id', document.id);

        if (updateError) throw updateError;
      } else {
        // Create new document
        const { error: insertError } = await supabase
          .from('planning_documents')
          .insert({
            student_id: studentId,
            title: file.name.replace(/\.[^/.]+$/, ""),
            file_path: fileName,
            file_name: file.name,
            content: extractedContent,
            google_doc_id: extractedContent,
            is_primary: true,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "上传成功",
        description: `已解析 ${extractedContent.length} 个字符`,
      });

      await loadDocument();
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    try {
      // Delete file from storage if exists
      if (document.file_path) {
        await supabase.storage
          .from('planning-documents')
          .remove([document.file_path]);
      }

      // Delete milestones first
      await supabase
        .from('planning_milestones')
        .delete()
        .eq('document_id', document.id);

      // Delete document record
      const { error } = await supabase
        .from('planning_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;

      toast({
        title: "删除成功",
        description: "规划方案已删除",
      });

      setDocument(null);
      setMilestonesRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: "删除失败",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!document?.file_path) return;

    try {
      const { data, error } = await supabase.storage
        .from('planning-documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name || 'document';
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download:', error);
      toast({
        title: "下载失败",
        variant: "destructive",
      });
    }
  };

  const handleExtractMilestones = async () => {
    if (!document?.content) {
      toast({
        title: "无内容可提取",
        description: "请先上传规划方案文档",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExtracting(true);

      const { data, error } = await supabase.functions.invoke('extract-milestones', {
        body: {
          documentContent: document.content,
          documentId: document.id,
          studentId: studentId,
          reminderEmails: [],
        },
      });

      if (error) throw error;

      toast({
        title: "提取成功",
        description: `已提取 ${data.milestonesCount} 个规划节点`,
      });

      setMilestonesRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Failed to extract milestones:', error);
      toast({
        title: "提取失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              规划方案
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <PlanningMilestones studentId={studentId} refreshTrigger={milestonesRefresh} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Planning Document */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              规划方案
            </CardTitle>
            {isCounselor && document && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExtractMilestones}
                  disabled={isExtracting}
                >
                  {isExtracting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  AI提取节点
                </Button>
                {document.file_path && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {document ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{document.title}</h3>
                  {document.file_name && (
                    <Badge variant="secondary" className="text-xs">
                      {document.file_name.split('.').pop()?.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <Badge variant="outline">
                  {new Date(document.updated_at).toLocaleDateString('zh-CN')}
                </Badge>
              </div>
              
              <ScrollArea className="h-[350px] rounded-md border p-4">
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {document.content || "暂无内容"}
                </div>
              </ScrollArea>

              {isCounselor && (
                <div className="pt-2">
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept=".docx,.txt"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <FileUp className="h-4 w-4 mr-2" />
                        )}
                        重新上传文档
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">暂无规划方案</p>
              <p className="text-xs text-muted-foreground mb-4">
                支持上传 .docx 或 .txt 文件
              </p>
              {isCounselor && (
                <label className="cursor-pointer">
                  <Input
                    type="file"
                    accept=".docx,.txt"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      上传规划方案
                    </span>
                  </Button>
                </label>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planning Milestones */}
      <PlanningMilestones studentId={studentId} refreshTrigger={milestonesRefresh} />
    </div>
  );
}
