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
  Download,
  ChevronRight
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
  const [documents, setDocuments] = useState<PlanningDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [milestonesRefresh, setMilestonesRefresh] = useState(0);
  const { toast } = useToast();
  const { profile } = useProfile();

  const isCounselor = profile?.user_type === 'counselor' || profile?.user_type === 'admin';

  const selectedDocument = documents.find(d => d.id === selectedDocId) || null;

  useEffect(() => {
    loadDocuments();
  }, [studentId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('planning_documents')
        .select('id, title, google_doc_id, file_path, file_name, content, created_at, updated_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const docs: PlanningDocument[] = (data || []).map(d => ({
        id: d.id,
        title: d.title,
        content: d.content || d.google_doc_id || "",
        file_path: d.file_path,
        file_name: d.file_name,
        created_at: d.created_at,
        updated_at: d.updated_at,
      }));

      setDocuments(docs);

      // Auto-select the first document if none selected
      if (docs.length > 0 && (!selectedDocId || !docs.find(d => d.id === selectedDocId))) {
        setSelectedDocId(docs[0].id);
      }
      if (docs.length === 0) {
        setSelectedDocId(null);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "不支持的文件格式",
        description: "请上传 .docx 或 .txt 文件",
        variant: "destructive",
      });
      return;
    }

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

      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('planning-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw new Error("文件上传失败: " + uploadError.message);
      }

      toast({
        title: "文件上传成功",
        description: "正在解析文档内容...",
      });

      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-document', {
        body: { filePath: fileName, studentId },
      });

      if (parseError) throw new Error("文档解析失败");
      if (parseData?.error) throw new Error(parseData.error);

      const extractedContent = parseData?.content || "";

      // Always create a new document record
      const { data: insertData, error: insertError } = await supabase
        .from('planning_documents')
        .insert({
          student_id: studentId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          file_path: fileName,
          file_name: file.name,
          content: extractedContent,
          google_doc_id: extractedContent,
          is_primary: false,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      toast({
        title: "上传成功",
        description: `已解析 ${extractedContent.length} 个字符`,
      });

      await loadDocuments();
      // Auto-select the newly uploaded document
      if (insertData?.id) {
        setSelectedDocId(insertData.id);
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (doc: PlanningDocument) => {
    try {
      if (doc.file_path) {
        await supabase.storage.from('planning-documents').remove([doc.file_path]);
      }

      await supabase.from('planning_milestones').delete().eq('document_id', doc.id);
      const { error } = await supabase.from('planning_documents').delete().eq('id', doc.id);
      if (error) throw error;

      toast({ title: "删除成功", description: "规划方案已删除" });

      if (selectedDocId === doc.id) {
        setSelectedDocId(null);
      }
      setMilestonesRefresh(prev => prev + 1);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({ title: "删除失败", variant: "destructive" });
    }
  };

  const handleDownload = async (doc: PlanningDocument) => {
    if (!doc.file_path) return;
    try {
      const { data, error } = await supabase.storage.from('planning-documents').download(doc.file_path);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.file_name || 'document';
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "下载失败", variant: "destructive" });
    }
  };

  const handleExtractMilestones = async () => {
    if (!selectedDocument?.content) {
      toast({
        title: "无内容可提取",
        description: "请先选择一个规划方案文档",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExtracting(true);

      const { data, error } = await supabase.functions.invoke('extract-milestones', {
        body: {
          documentContent: selectedDocument.content,
          documentId: selectedDocument.id,
          studentId,
          reminderEmails: [],
        },
      });

      if (error) throw error;

      toast({
        title: "提取成功",
        description: `已从「${selectedDocument.title}」提取 ${data.milestonesCount} 个规划节点`,
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
      {/* Planning Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              规划方案
              <Badge variant="outline" className="ml-1">{documents.length}</Badge>
            </CardTitle>
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
                  size="sm"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    上传方案
                  </span>
                </Button>
              </label>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-4">
              {/* Document List */}
              <ScrollArea className="max-h-[160px]">
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedDocId === doc.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedDocId(doc.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${
                          selectedDocId === doc.id ? 'rotate-90 text-primary' : 'text-muted-foreground'
                        }`} />
                        <span className="text-sm font-medium truncate">{doc.title}</span>
                        {doc.file_name && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {doc.file_name.split('.').pop()?.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.updated_at).toLocaleDateString('zh-CN')}
                        </span>
                        {doc.file_path && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isCounselor && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Selected Document Content */}
              {selectedDocument && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      当前选中：{selectedDocument.title}
                    </h3>
                    {isCounselor && (
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
                    )}
                  </div>
                  <ScrollArea className="h-[250px] rounded-md border p-4">
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {selectedDocument.content || "暂无内容"}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">暂无规划方案</p>
              <p className="text-xs text-muted-foreground mb-4">
                支持上传 .docx 或 .txt 文件，可上传多个方案
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
                  <Button variant="outline" disabled={isUploading} asChild>
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
