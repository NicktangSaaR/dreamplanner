
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login with email:", email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.error("Login error:", signInError);
        
        if (signInError.message.includes("Email not confirmed")) {
          toast.error("请先验证您的邮箱。请检查收件箱中的验证链接。");
        } else if (signInError.message.includes("Invalid login credentials")) {
          toast.error("邮箱或密码不正确。请重试或注册新账号。");
        } else {
          toast.error(signInError.message);
        }
        return;
      }

      if (!data.user) {
        toast.error("未收到用户数据");
        return;
      }

      console.log("Login successful, fetching profile...");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_type, is_admin")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("获取用户信息失败");
        return;
      }

      console.log("User profile:", profile);

      // Redirect based on user type
      if (profile?.user_type === "counselor") {
        navigate("/counselor-dashboard");
      } else if (profile?.user_type === "student") {
        navigate(`/student-dashboard/${data.user.id}`);
      } else if (profile?.is_admin) {
        navigate("/admin-dashboard");
      } else {
        navigate("/college-planning");
      }

      toast.success("登录成功！");
    } catch (error) {
      console.error("Unexpected login error:", error);
      toast.error("登录过程中发生意外错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          placeholder="请输入邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
