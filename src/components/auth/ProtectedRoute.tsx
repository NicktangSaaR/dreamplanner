
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { homePath } from "@/shared/homePath";

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

  // Return children only when all checks pass
  return <>{children}</>;
}
