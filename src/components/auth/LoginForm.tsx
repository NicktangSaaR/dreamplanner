
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
      // First sign in to get the session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.error("Login error:", signInError);
        if (signInError.message.includes("Invalid login credentials")) {
          toast.error("邮箱或密码不正确。请重试或注册新账号。");
        } else {
          toast.error("登录失败: " + signInError.message);
        }
        return;
      }

      if (!signInData.user) {
        toast.error("登录失败：未收到用户数据");
        return;
      }

      console.log("Successfully signed in user:", signInData.user.id);

      // Wait a short moment to ensure the session is properly established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Now fetch the profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", signInData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("获取用户信息失败：" + profileError.message);
        return;
      }

      if (!profile) {
        console.error("No profile found for user:", signInData.user.id);
        toast.error("未找到用户信息");
        return;
      }

      console.log("Retrieved user profile:", profile);

      // Redirect based on user type
      switch (profile.user_type) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "counselor":
          navigate("/counselor-dashboard");
          break;
        case "student":
          navigate(`/student-dashboard/${signInData.user.id}`);
          break;
        default:
          console.error("Unknown user type:", profile.user_type);
          toast.error(`未知的用户类型: ${profile.user_type}`);
          return;
      }

      toast.success("登录成功！");
    } catch (error) {
      console.error("Unexpected error during login:", error);
      toast.error("登录过程中发生意外错误，请重试");
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
