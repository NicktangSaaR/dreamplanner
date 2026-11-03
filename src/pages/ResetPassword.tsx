import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AuthCard from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_LENGTH = 8;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The recovery link signs the user in; wait for that session before
  // showing the form.
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    let settled = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        settled = true;
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        settled = true;
        setStatus("ready");
      }
    });

    // Give the auth client a moment to process the link before giving up.
    const timer = window.setTimeout(() => {
      if (!settled) setStatus("invalid");
    }, 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`密码至少需要 ${MIN_LENGTH} 位。`);
      return;
    }
    if (password !== confirm) {
      setError("两次输入的密码不一致。");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    await supabase.auth.signOut();
    toast.success("密码已更新，请用新密码登录");
    navigate("/login");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <AuthCard
          title="设置新密码"
          subtitle={
            status === "invalid"
              ? "重置链接无效或已过期"
              : "请输入你的新密码"
          }
          footer={
            <Link to={status === "invalid" ? "/forgot-password" : "/login"} className="font-semibold text-primary hover:underline">
              {status === "invalid" ? "重新发送重置链接" : "返回登录"}
            </Link>
          }
        >
          {status === "checking" && (
            <p className="text-center text-sm text-muted-foreground">正在验证链接...</p>
          )}
          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={MIN_LENGTH}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={MIN_LENGTH}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "保存中..." : "保存新密码"}
              </Button>
            </form>
          )}
        </AuthCard>
      </div>
    </div>
  );
}
