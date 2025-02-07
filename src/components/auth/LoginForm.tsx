
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
      // Step 1: Sign in
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

      console.log("Successfully signed in, attempting to fetch profile for user:", signInData.user.id);

      // Step 2: Get profile with direct query
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", signInData.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        console.log("Profile query details:", {
          error: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        toast.error("获取用户信息失败，默认导向学生页面");
        navigate(`/student-dashboard/${signInData.user.id}`);
        return;
      }

      if (!profileData) {
        console.warn("No profile found for user:", signInData.user.id);
        toast.error("未找到用户信息，默认导向学生页面");
        navigate(`/student-dashboard/${signInData.user.id}`);
        return;
      }

      // Step 3: Redirect based on user type
      console.log("Profile data:", profileData);
      
      switch (profileData.user_type) {
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
          console.warn("Unknown user type:", profileData.user_type);
          navigate(`/student-dashboard/${signInData.user.id}`);
          break;
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
