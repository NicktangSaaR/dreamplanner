import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Link2, Unlink, Loader2, FolderOpen } from "lucide-react";

interface GoogleDriveConnectProps {
  studentId: string;
  onConnectionChange?: (connected: boolean, folderId?: string) => void;
}

export default function GoogleDriveConnect({ studentId, onConnectionChange }: GoogleDriveConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [folderId, setFolderId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === studentId) {
      handleOAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [studentId]);

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'check-status', studentId },
      });

      if (error) throw error;

      setIsConnected(data.connected);
      setFolderId(data.folderId);
      onConnectionChange?.(data.connected, data.folderId);
    } catch (error) {
      console.error('Failed to check Google Drive status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      
      const { data, error } = await supabase.functions.invoke('google-drive-auth', {
        body: { 
          action: 'get-auth-url', 
          studentId,
          redirectUri,
        },
      });

      if (error) throw error;

      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Failed to initiate Google Drive connection:', error);
      toast({
        title: "连接失败",
        description: "无法启动 Google Drive 授权",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      setIsLoading(true);
      const redirectUri = `${window.location.origin}${window.location.pathname}`;

      const { data, error } = await supabase.functions.invoke('google-drive-auth', {
        body: { 
          action: 'exchange-code', 
          code,
          studentId,
          redirectUri,
        },
      });

      if (error) throw error;

      toast({
        title: "连接成功",
        description: "Google Drive 已成功授权",
      });

      setIsConnected(true);
      onConnectionChange?.(true);
    } catch (error) {
      console.error('OAuth callback failed:', error);
      toast({
        title: "授权失败",
        description: error instanceof Error ? error.message : "Google Drive 授权失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'disconnect', studentId },
      });

      if (error) throw error;

      toast({
        title: "已断开连接",
        description: "Google Drive 授权已取消",
      });

      setIsConnected(false);
      setFolderId(null);
      onConnectionChange?.(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast({
        title: "断开失败",
        description: "无法断开 Google Drive 连接",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          Google Drive 连接
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Link2 className="h-4 w-4" />
              <span>已连接到 Google Drive</span>
            </div>
            {folderId && (
              <p className="text-xs text-muted-foreground">
                文件夹 ID: {folderId}
              </p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
              className="w-full"
            >
              <Unlink className="h-4 w-4 mr-2" />
              断开连接
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              连接 Google Drive 以同步规划方案文档
            </p>
            <Button onClick={handleConnect} className="w-full">
              <Link2 className="h-4 w-4 mr-2" />
              连接 Google Drive
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
