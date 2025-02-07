
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
      console.log("Attempting to sign in with email:", email);
      
      // 1. 尝试登录
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
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
        setIsLoading(false);
        return;
      }

      if (!user) {
        console.error("No user data received after successful login");
        toast.error("登录失败：未收到用户数据");
        setIsLoading(false);
        return;
      }

      console.log("Successfully signed in user:", user.id);

      // 2. 获取用户资料
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      console.log("Profile query result:", { profile, profileError });

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("获取用户资料失败，请重试");
        setIsLoading(false);
        return;
      }

      if (!profile) {
        console.error("No profile found for user:", user.id);
        toast.error("未找到用户资料，请联系管理员");
        setIsLoading(false);
        return;
      }

      // 3. 根据用户类型重定向
      console.log("User profile found:", profile);
      
      let redirectPath = "/college-planning"; // 默认重定向路径

      if (profile.user_type === "counselor") {
        redirectPath = "/counselor-dashboard";
      } else if (profile.user_type === "student") {
        redirectPath = `/student-dashboard/${user.id}`;
      } else if (profile.is_admin) {
        redirectPath = "/admin-dashboard";
      }

      console.log("Redirecting to:", redirectPath);
      navigate(redirectPath);
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
