
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

      // 只获取用户类型信息
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("user_type, is_admin")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user type:", userError);
        toast.error("获取用户信息失败");
        return;
      }

      // 根据用户类型直接跳转
      if (userData.is_admin) {
        navigate("/admin-dashboard");
      } else if (userData.user_type === "counselor") {
        navigate("/counselor-dashboard");
      } else if (userData.user_type === "student") {
        navigate(`/student-dashboard/${user.id}`);
      } else {
        navigate("/college-planning");
      }

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
