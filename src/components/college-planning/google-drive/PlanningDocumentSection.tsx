import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Calendar as CalendarIcon,
  AlertCircle
} from "lucide-react";
import PlanningMilestones from "./PlanningMilestones";

interface PlanningDocumentSectionProps {
  studentId: string;
}

interface PlanningDocument {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function PlanningDocumentSection({ studentId }: PlanningDocumentSectionProps) {
  const [document, setDocument] = useState<PlanningDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
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
        .select('id, title, google_doc_id, created_at, updated_at')
        .eq('student_id', studentId)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // The google_doc_id field is repurposed to store the content
        setDocument({
          id: data.id,
          title: data.title,
          content: data.google_doc_id || "",
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

  const handleStartEditing = () => {
    if (document) {
      setEditTitle(document.title);
      setEditContent(document.content);
    } else {
      setEditTitle("规划方案");
      setEditContent("");
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast({
        title: "请输入标题",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      if (document) {
        // Update existing document
        const { error } = await supabase
          .from('planning_documents')
          .update({
            title: editTitle,
            google_doc_id: editContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', document.id);

        if (error) throw error;
      } else {
        // Create new document
        const { error } = await supabase
          .from('planning_documents')
          .insert({
            student_id: studentId,
            title: editTitle,
            google_doc_id: editContent,
            is_primary: true,
          });

        if (error) throw error;
      }

      toast({
        title: "保存成功",
        description: "规划方案已保存",
      });

      setIsEditing(false);
      await loadDocument();
    } catch (error) {
      console.error('Failed to save document:', error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    try {
      // Delete milestones first
      await supabase
        .from('planning_milestones')
        .delete()
        .eq('document_id', document.id);

      // Delete document
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
      setIsEditing(false);
      setMilestonesRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: "删除失败",
        variant: "destructive",
      });
    }
  };

  const handleExtractMilestones = async () => {
    if (!document?.content) {
      toast({
        title: "无内容可提取",
        description: "请先添加规划方案内容",
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
            {isCounselor && !isEditing && (
              <div className="flex items-center gap-2">
                {document && (
                  <>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEditing}
                >
                  {document ? "编辑" : "上传方案"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">标题</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="请输入规划方案标题"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">内容</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="请粘贴或输入规划方案内容..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  取消
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  保存
                </Button>
              </div>
            </div>
          ) : document ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{document.title}</h3>
                <Badge variant="outline">
                  {new Date(document.updated_at).toLocaleDateString('zh-CN')}
                </Badge>
              </div>
              <ScrollArea className="h-[350px] rounded-md border p-4">
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {document.content || "暂无内容"}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">暂无规划方案</p>
              {isCounselor && (
                <Button
                  variant="outline"
                  onClick={handleStartEditing}
                  className="mt-4"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上传规划方案
                </Button>
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
