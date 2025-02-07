
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
      
      // 1. Sign in attempt
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

      const user = signInData.user;
      if (!user) {
        console.error("No user data received after successful login");
        toast.error("登录失败：未收到用户数据");
        return;
      }

      console.log("Successfully signed in user:", user.id);

      // 2. Fetch user profile with improved error handling
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // Sign out the user if we can't fetch their profile
        await supabase.auth.signOut();
        toast.error("获取用户资料失败：" + profileError.message);
        return;
      }

      if (!profileData) {
        console.error("No profile found for user:", user.id);
        // Sign out the user if they don't have a profile
        await supabase.auth.signOut();
        toast.error("未找到用户资料，请联系管理员");
        return;
      }

      // 3. Redirect based on user type with improved logging
      console.log("User profile found:", profileData);
      
      let redirectPath = "/college-planning"; // Default redirect path

      if (profileData.is_admin) {
        console.log("User is admin, redirecting to admin dashboard");
        redirectPath = "/admin-dashboard";
      } else if (profileData.user_type === "counselor") {
        console.log("User is counselor, redirecting to counselor dashboard");
        redirectPath = "/counselor-dashboard";
      } else if (profileData.user_type === "student") {
        console.log("User is student, redirecting to student dashboard");
        redirectPath = `/student-dashboard/${user.id}`;
      }

      console.log("Redirecting to:", redirectPath);
      navigate(redirectPath);
      toast.success("登录成功！");

    } catch (error) {
      console.error("Unexpected login error:", error);
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
