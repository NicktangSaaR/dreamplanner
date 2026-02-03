import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  FileText, 
  RefreshCw, 
  Loader2, 
  Sparkles,
  ExternalLink,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlanningDocumentViewerProps {
  studentId: string;
  documentId: string | null;
  documentName: string | null;
  onMilestonesExtracted?: () => void;
}

export default function PlanningDocumentViewer({ 
  studentId, 
  documentId,
  documentName,
  onMilestonesExtracted,
}: PlanningDocumentViewerProps) {
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [reminderEmails, setReminderEmails] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (documentId) {
      loadDocumentContent();
    } else {
      setContent('');
      setTitle('');
    }
  }, [documentId]);

  const loadDocumentContent = async () => {
    if (!documentId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('google-drive-files', {
        body: { 
          action: 'get-doc-content', 
          studentId,
          fileId: documentId,
        },
      });

      if (error) throw error;

      setTitle(data.title || documentName || '规划方案');
      setContent(data.content || '');
    } catch (error) {
      console.error('Failed to load document:', error);
      toast({
        title: "加载失败",
        description: "无法加载文档内容",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractMilestones = () => {
    setShowEmailDialog(true);
  };

  const extractMilestones = async () => {
    if (!content) return;

    try {
      setIsExtracting(true);
      setShowEmailDialog(false);

      const emails = reminderEmails
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      const { data, error } = await supabase.functions.invoke('extract-milestones', {
        body: { 
          documentContent: content,
          documentId,
          studentId,
          reminderEmails: emails,
        },
      });

      if (error) throw error;

      toast({
        title: "提取成功",
        description: `已提取 ${data.milestonesCount} 个时间节点`,
      });

      onMilestonesExtracted?.();
    } catch (error) {
      console.error('Failed to extract milestones:', error);
      toast({
        title: "提取失败",
        description: error instanceof Error ? error.message : "无法提取时间节点",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  if (!documentId) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            规划方案正文
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              请从左侧文件列表中选择一个规划方案文档
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {title || '规划方案正文'}
              </CardTitle>
              <Badge variant="secondary">Google Doc</Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadDocumentContent}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button 
                size="sm"
                onClick={handleExtractMilestones}
                disabled={isExtracting || !content}
              >
                {isExtracting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                AI 提取节点
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {content.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? (
                    <p key={index} className="mb-3">
                      {paragraph}
                    </p>
                  ) : (
                    <br key={index} />
                  )
                ))}
                {!content && (
                  <p className="text-muted-foreground text-center py-8">
                    文档内容为空
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              设置提醒邮箱
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emails">
                提醒邮箱（多个邮箱用逗号分隔）
              </Label>
              <Input
                id="emails"
                placeholder="student@example.com, parent@example.com"
                value={reminderEmails}
                onChange={(e) => setReminderEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                系统将在每个截止日期前一周发送邮件提醒到这些邮箱
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              取消
            </Button>
            <Button onClick={extractMilestones} disabled={isExtracting}>
              {isExtracting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              开始提取
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
