import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FolderOpen, Loader2, Save, X } from "lucide-react";

interface GoogleDriveConnectProps {
  studentId: string;
  onConnectionChange?: (connected: boolean, folderId?: string) => void;
}

export default function GoogleDriveConnect({ studentId, onConnectionChange }: GoogleDriveConnectProps) {
  const [folderId, setFolderId] = useState<string>("");
  const [savedFolderId, setSavedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkFolderStatus();
  }, [studentId]);

  const checkFolderStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'get-student-folder', studentId },
      });

      if (error) throw error;

      setSavedFolderId(data.folderId);
      setFolderId(data.folderId || "");
      onConnectionChange?.(data.hasFolder, data.folderId);
    } catch (error) {
      console.error('Failed to check folder status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFolder = async () => {
    if (!folderId.trim()) {
      toast({
        title: "请输入文件夹 ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase.functions.invoke('google-drive-auth', {
        body: { 
          action: 'set-student-folder', 
          studentId,
          folderId: folderId.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: "保存成功",
        description: "学生文件夹已关联",
      });

      setSavedFolderId(folderId.trim());
      onConnectionChange?.(true, folderId.trim());
    } catch (error) {
      console.error('Failed to save folder:', error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "无法保存文件夹 ID",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFolder = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'remove-student-folder', studentId },
      });

      if (error) throw error;

      toast({
        title: "已移除",
        description: "学生文件夹关联已移除",
      });

      setSavedFolderId(null);
      setFolderId("");
      onConnectionChange?.(false);
    } catch (error) {
      console.error('Failed to remove folder:', error);
      toast({
        title: "移除失败",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          学生 Google Drive 文件夹
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="folderId">Google Drive 文件夹 ID</Label>
          <div className="flex gap-2">
            <Input
              id="folderId"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="输入文件夹 ID..."
              className="flex-1"
            />
            <Button 
              onClick={handleSaveFolder} 
              disabled={isSaving || !folderId.trim()}
              size="icon"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
            {savedFolderId && (
              <Button 
                variant="outline" 
                onClick={handleRemoveFolder} 
                disabled={isSaving}
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            从 Google Drive 文件夹 URL 中获取 ID（/folders/ 后面的部分）
          </p>
        </div>
        {savedFolderId && (
          <div className="text-sm text-green-600 flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>已关联文件夹: {savedFolderId}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
