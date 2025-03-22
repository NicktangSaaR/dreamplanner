
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { QueryClient } from "@tanstack/react-query";

interface AuthCheckProps {
  children: React.ReactNode;
  queryClient: QueryClient;
}

export default function AuthCheck({ children, queryClient }: AuthCheckProps) {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error checking session:", error);
          toast({
            title: "Error",
            description: "会话检查失败",
          });
          navigate('/login');
          return;
        }

        if (!session) {
          console.log("No active session, redirecting to login");
          navigate('/login');
          return;
        }

        console.log("Current session user:", session.user.id);
        setIsAuthChecking(false);
      } catch (error) {
        console.error("Error in auth check:", error);
        toast({
          title: "Error",
          description: "认证检查失败",
        });
        navigate('/login');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (!session) {
        queryClient.clear();
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, redirecting to login");
          navigate('/login');
        } else {
          console.log("Session expired, redirecting to login");
          toast({
            title: "Error",
            description: "会话已过期，请重新登录",
          });
          navigate('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, queryClient]);

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
