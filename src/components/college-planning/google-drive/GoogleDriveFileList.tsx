import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  FileText, 
  Folder, 
  RefreshCw, 
  ExternalLink, 
  Loader2,
  FolderOpen,
  CheckCircle,
  Star
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
}

interface GoogleDriveFolder {
  id: string;
  name: string;
  modifiedTime: string;
}

interface GoogleDriveFileListProps {
  studentId: string;
  folderId: string | null;
  onSelectDocument?: (fileId: string, fileName: string) => void;
  onFolderChange?: (folderId: string) => void;
}

export default function GoogleDriveFileList({ 
  studentId, 
  folderId,
  onSelectDocument,
  onFolderChange,
}: GoogleDriveFileListProps) {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const { toast } = useToast();

  const openInNewTab = (url: string) => {
    // Google Drive/Docs disallow being embedded in iframes; always open in a new tab.
    // Some browsers/iframe environments may block window.open; provide a DOM fallback.
    try {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (opened) return;
    } catch {
      // ignore and fallback below
    }

    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  useEffect(() => {
    if (folderId) {
      loadFiles();
    }
  }, [folderId, studentId]);

  const loadFiles = async () => {
    if (!folderId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('google-drive-files', {
        body: { 
          action: 'list-files', 
          studentId,
          folderId,
        },
      });

      if (error) throw error;
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast({
        title: "加载失败",
        description: "无法加载文件列表",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('google-drive-files', {
        body: { 
          action: 'list-folders', 
          studentId,
        },
      });

      if (error) throw error;
      setFolders(data.folders || []);
      setShowFolderPicker(true);
    } catch (error) {
      console.error('Failed to load folders:', error);
      toast({
        title: "加载失败",
        description: "无法加载文件夹列表",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectFolder = async (selectedFolderId: string) => {
    try {
      const { error } = await supabase.functions.invoke('google-drive-files', {
        body: { 
          action: 'set-folder', 
          studentId,
          folderId: selectedFolderId,
        },
      });

      if (error) throw error;

      toast({
        title: "文件夹已设置",
        description: "规划方案文件夹已更新",
      });

      setShowFolderPicker(false);
      onFolderChange?.(selectedFolderId);
    } catch (error) {
      console.error('Failed to set folder:', error);
      toast({
        title: "设置失败",
        description: "无法设置文件夹",
        variant: "destructive",
      });
    }
  };

  const handleSelectDocument = (file: GoogleDriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.document') {
      setSelectedFileId(file.id);
      onSelectDocument?.(file.id, file.name);
    } else {
      // Open in new tab for non-Google Docs
      openInNewTab(file.webViewLink);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.document') {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="h-4 w-4 text-yellow-500" />;
    }
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  if (!folderId) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">规划方案文档</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              请选择一个 Google Drive 文件夹来存放规划方案
            </p>
            <Button onClick={loadFolders} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FolderOpen className="h-4 w-4 mr-2" />
              )}
              选择文件夹
            </Button>
          </div>
        </CardContent>

        <Dialog open={showFolderPicker} onOpenChange={setShowFolderPicker}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>选择规划方案文件夹</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {folders.map((folder) => (
                  <Button
                    key={folder.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => selectFolder(folder.id)}
                  >
                    <Folder className="h-4 w-4 mr-2 text-yellow-500" />
                    {folder.name}
                  </Button>
                ))}
                {folders.length === 0 && !isLoading && (
                  <p className="text-center text-muted-foreground py-4">
                    没有找到文件夹
                  </p>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">规划方案文档</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={loadFolders}>
              <Folder className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={loadFiles} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : files.length > 0 ? (
              files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                    selectedFileId === file.id ? 'border-primary bg-accent' : ''
                  }`}
                  onClick={() => handleSelectDocument(file)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(file.modifiedTime), { 
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedFileId === file.id && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInNewTab(file.webViewLink);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                文件夹中没有文件
              </p>
            )}
          </div>
        </ScrollArea>

        <Dialog open={showFolderPicker} onOpenChange={setShowFolderPicker}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>更换文件夹</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {folders.map((folder) => (
                  <Button
                    key={folder.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => selectFolder(folder.id)}
                  >
                    <Folder className="h-4 w-4 mr-2 text-yellow-500" />
                    {folder.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
