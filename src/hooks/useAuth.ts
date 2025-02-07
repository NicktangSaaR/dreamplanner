
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type UserType = "student" | "counselor" | "admin";

interface UserProfile {
  id: string;
  user_type: UserType;
  email?: string | null;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<UserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, user_type, email")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return profileData;
    },
  });

  const login = async (email: string, password: string) => {
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        handleAuthError(signInError);
        return;
      }

      if (!authData.user) {
        toast.error("未收到用户数据");
        return;
      }

      // 刷新用户数据
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      
      // 获取最新的 profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", authData.user.id)
        .single();

      if (profileData) {
        redirectBasedOnUserType(profileData.user_type, authData.user.id);
      }

    } catch (error) {
      console.error("Unexpected login error:", error);
      toast.error("登录过程中发生意外错误");
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.clear();
      navigate("/");
      toast.success("成功登出");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("登出失败");
    }
  };

  const redirectBasedOnUserType = (userType: UserType, userId: string) => {
    switch (userType) {
      case "counselor":
        navigate("/counselor-dashboard");
        break;
      case "student":
        navigate(`/student-dashboard/${userId}`);
        break;
      case "admin":
        navigate("/admin-dashboard");
        break;
      default:
        console.error("Unknown user type:", userType);
        toast.error("未知的用户类型");
    }
  };

  const handleAuthError = (error: any) => {
    console.error("Login error:", error);
    if (error.message.includes("Email not confirmed")) {
      toast.error("请先验证您的邮箱。请检查收件箱中的验证链接。");
    } else if (error.message.includes("Invalid login credentials")) {
      toast.error("邮箱或密码不正确。请重试或注册新账号。");
    } else {
      toast.error(error.message);
    }
  };

  return {
    profile,
    isLoading,
    login,
    logout,
    isAuthenticated: !!profile,
    userType: profile?.user_type,
  };
};
