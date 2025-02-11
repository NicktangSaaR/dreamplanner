
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAuthSession = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session check error:", error);
          queryClient.setQueryData(["user-profile"], null);
          return;
        }
        if (session) {
          console.log("Initial session found");
          queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        } else {
          console.log("No initial session found");
          queryClient.setQueryData(["user-profile"], null);
        }
      } catch (error) {
        console.error("Unexpected error checking session:", error);
        queryClient.setQueryData(["user-profile"], null);
      }
    };

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_OUT') {
        queryClient.setQueryData(["user-profile"], null);
        navigate("/");
      } else if (event === 'SIGNED_IN' && session) {
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, navigate]);
};
