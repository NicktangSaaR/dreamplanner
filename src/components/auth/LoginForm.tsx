
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
      console.log("Starting login process...");
      
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
        console.error("No user data received after login");
        toast.error("登录失败：未收到用户数据");
        return;
      }

      console.log("Successfully signed in, user ID:", signInData.user.id);

      // Step 2: Get profile with direct query and retry logic
      let profileData = null;
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 2000; // Increased to 2 seconds between retries

      while (retryCount < maxRetries) {
        console.log(`Profile fetch attempt ${retryCount + 1} for user ${signInData.user.id}`);
        
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", signInData.user.id)
            .maybeSingle();

          if (error) {
            console.error(`Profile fetch attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount === maxRetries) {
              throw new Error("获取用户信息失败，请联系管理员或稍后重试");
            }
            console.log(`Waiting ${retryDelay}ms before retry ${retryCount + 1}...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }

          if (!data) {
            console.error(`No profile found for user ${signInData.user.id}`);
            throw new Error("用户档案不存在，请联系管理员");
          }

          console.log("Profile data retrieved:", data);
          profileData = data;
          break;
        } catch (error) {
          console.error(`Error in attempt ${retryCount + 1}:`, error);
          retryCount++;
          if (retryCount === maxRetries) {
            throw error;
          }
          console.log(`Waiting ${retryDelay}ms before retry ${retryCount + 1}...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      if (!profileData) {
        console.error("No profile data after all retries");
        throw new Error("无法获取用户信息，请确认账号已激活并重试");
      }

      if (!profileData.user_type) {
        console.error("Profile data missing user_type:", profileData);
        throw new Error("用户类型未设置，请联系管理员设置用户类型");
      }

      // Step 3: Redirect based on user type
      console.log("Redirecting user with type:", profileData.user_type);
      
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
          console.error("Invalid user type:", profileData.user_type);
          throw new Error("未知的用户类型，请联系管理员修正用户类型");
      }
      
      toast.success("登录成功！");
    } catch (error) {
      console.error("Error during login process:", error);
      const errorMessage = error instanceof Error ? error.message : "登录过程中发生意外错误，请稍后重试";
      toast.error(errorMessage);
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
