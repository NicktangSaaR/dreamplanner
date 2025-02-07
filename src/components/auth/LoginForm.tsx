
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
      // First authenticate with Supabase
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
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

      if (!authData.user) {
        toast.error("未收到用户数据");
        return;
      }

      // Add a small delay to ensure the auth state is properly updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // After successful authentication, get user profile with retry logic
      let retryCount = 0;
      let profile = null;
      let profileError = null;

      while (retryCount < 3 && !profile) {
        const { data: profileData, error: fetchError } = await supabase
          .from("profiles")
          .select("user_type, id")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (!fetchError && profileData) {
          profile = profileData;
          break;
        }

        profileError = fetchError;
        retryCount++;
        
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }

      if (!profile) {
        console.error("Error fetching profile:", profileError);
        toast.error("获取用户信息失败，请重试");
        return;
      }

      console.log("User profile:", profile);

      // Redirect based on user type with proper error handling
      switch (profile.user_type) {
        case "counselor":
          navigate("/counselor-dashboard");
          break;
        case "student":
          navigate(`/student-dashboard/${profile.id}`);
          break;
        case "admin":
          navigate("/admin-dashboard");
          break;
        default:
          console.error("Unknown user type:", profile.user_type);
          toast.error("未知的用户类型");
          return;
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
