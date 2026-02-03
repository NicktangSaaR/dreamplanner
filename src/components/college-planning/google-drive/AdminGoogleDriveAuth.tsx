import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Link2, Unlink, Loader2, Shield, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminGoogleDriveAuth() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkUserAndAdminStatus();
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'admin') {
      handleOAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkUserAndAdminStatus = async () => {
    try {
      // First check if user is admin
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profile?.user_type !== 'admin') {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAdmin(true);

      // Then check Google Drive connection status
      const { data, error } = await supabase.functions.invoke('google-drive-auth', {
        body: { action: 'check-admin-status' },
      });

      if (error) throw error;
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Failed to check admin status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      
      const { data, error } = await supabase.functions.invoke('google-drive-auth', {
        body: { 
          action: 'admin-get-auth-url', 
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
      setIsConnecting(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      setIsLoading(true);
      const redirectUri = `${window.location.origin}${window.location.pathname}`;

      const { data, error } = await supabase.functions.invoke('google-drive-auth', {
        body: { 
          action: 'admin-exchange-code', 
          code,
          redirectUri,
        },
      });

      if (error) throw error;

      toast({
        title: "授权成功",
        description: "管理员 Google Drive 已连接",
      });

      setIsConnected(true);
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

  // Don't show anything for non-admin users
  if (!isLoading && !isAdmin) {
    return null;
  }

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
    <Card className="border-2 border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" />
          管理员 Google Drive 授权
        </CardTitle>
        <CardDescription>
          授权后可以访问您 Google Drive 中所有学生的规划文件夹
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">已授权</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Google Drive 已连接，可以访问学生文件夹
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">未授权</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  需要先授权 Google Drive 才能访问学生规划文档
                </p>
              </div>
            </div>
            <Button 
              onClick={handleConnect} 
              className="w-full"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              授权 Google Drive
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
