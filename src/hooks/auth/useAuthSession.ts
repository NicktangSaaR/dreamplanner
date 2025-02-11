
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuthSession = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          if (mounted) {
            queryClient.setQueryData(["user-profile"], null);
            // Only show error toast and redirect if we're not already on the login page
            if (window.location.pathname !== '/login') {
              toast.error("会话已过期");
              navigate("/login");
            }
          }
          return;
        }

        if (!mounted) return;

        if (session) {
          console.log("Session found:", session.user.id);
          // Refresh user profile data
          queryClient.invalidateQueries({ queryKey: ["user-profile"] });
          
          // If user is on login page but has valid session, redirect to dashboard
          if (window.location.pathname === '/login') {
            navigate("/");
          }
        } else {
          console.log("No session found");
          queryClient.setQueryData(["user-profile"], null);
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            toast.error("请先登录");
            navigate("/login");
          }
        }
      } catch (error) {
        console.error("Unexpected error checking session:", error);
        if (mounted) {
          queryClient.setQueryData(["user-profile"], null);
          if (window.location.pathname !== '/login') {
            toast.error("会话检查失败，请重新登录");
            navigate("/login");
          }
        }
      }
    };

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
        queryClient.setQueryData(["user-profile"], null);
        queryClient.clear();
        
        // Only show error and redirect if not already on login page
        if (window.location.pathname !== '/login') {
          toast.error("会话已过期，请重新登录");
          navigate("/login");
        }
      } else if (event === 'SIGNED_IN' && session) {
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        // Redirect to home if on login page
        if (window.location.pathname === '/login') {
          navigate("/");
        }
      }
    });

    // Initial session check
    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, navigate]);
};
