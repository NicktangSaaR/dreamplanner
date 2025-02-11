
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
      if (allowedUserTypes && profile && !allowedUserTypes.includes(profile.user_type)) {
        toast.error("您没有权限访问此页面");
        navigate("/");
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
