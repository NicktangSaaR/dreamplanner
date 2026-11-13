
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { homePath } from "@/shared/homePath";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: ("student" | "counselor" | "admin")[];
}

export default function ProtectedRoute({ 
  children, 
  allowedUserTypes 
}: ProtectedRouteProps) {
  const { profile, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Always check authentication status first
    if (!isLoading) {
      if (!isAuthenticated) {
        toast.error("请先登录");
        navigate("/login");
        return;
      }

      // Only check user type if both allowedUserTypes and profile exist
      // Signed in but this page is for another kind of account: go to their own dashboard.
      if (allowedUserTypes && profile && !allowedUserTypes.includes(profile.user_type)) {
        const home = homePath(profile.user_type, profile.id);
        if (home !== "/") {
          navigate(home, { replace: true });
        } else {
          toast.error("你没有权限访问这个页面");
          navigate("/", { replace: true });
        }
      }
    }
  }, [isLoading, isAuthenticated, profile, allowedUserTypes, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Counselor accounts wait for an admin's approval before they can be used.
  if (profile?.user_type === "counselor" && !profile.is_verified) {
    return <PendingApproval />;
  }

  // Return children only when all checks pass
  return <>{children}</>;
}

function PendingApproval() {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold text-pine">账号等待审核 · Pending approval</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        你的顾问账号已经注册成功，需要管理员审核通过后才能使用。审核通过后重新登录即可。
        <br />
        Your counselor account has been created and is waiting for an administrator to approve it. Please sign in again once it's approved.
      </p>
      <Button variant="outline" className="mt-8" onClick={signOut}>退出登录 · Sign out</Button>
    </div>
  );
}
