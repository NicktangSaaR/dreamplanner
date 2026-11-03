import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AuthCard from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    // Rate limits are the only error worth surfacing; for anything else show
    // the same confirmation so the page doesn't reveal which emails exist.
    if (error && error.status === 429) {
      setError("请求过于频繁，请稍后再试。");
      return;
    }
    setSent(true);
  };

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" size="icon" onClick={() => navigate("/login")} className="mb-4" aria-label="返回登录">
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <AuthCard
          title="忘记密码"
          subtitle={sent ? "请查收邮件" : "输入注册邮箱，我们会发送重置密码的链接"}
          footer={
            <Link to="/login" className="font-semibold text-primary hover:underline">
              返回登录
            </Link>
          }
        >
          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
              <MailCheck className="h-10 w-10 text-primary" />
              <p>
                如果 <span className="font-medium text-foreground">{email}</span> 已注册，
                你会在几分钟内收到一封重置密码的邮件。没有收到的话，请检查垃圾邮件文件夹。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "发送中..." : "发送重置链接"}
              </Button>
            </form>
          )}
        </AuthCard>
      </div>
    </div>
  );
}
