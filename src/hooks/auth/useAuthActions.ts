
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserType } from "./types";

export const useAuthActions = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const login = async (email: string, password: string) => {
    try {
      console.log("Starting login process...");
      
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        handleAuthError(signInError);
        return;
      }

      if (!authData.user) {
        toast.error("No user data received");
        return;
      }

      console.log("Authentication successful, fetching profile...");
      
      // Refresh user data
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      
      // Get latest profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile after login:", profileError);
        toast.error("Failed to get user information");
        return;
      }

      if (!profileData) {
        console.error("No profile found after login");
        toast.error("User information not found");
        return;
      }

      console.log("Login successful, redirecting...");
      redirectBasedOnUserType(profileData.user_type as UserType, authData.user.id);

    } catch (error) {
      console.error("Unexpected login error:", error);
      toast.error("An unexpected error occurred during login");
    }
  };

  const logout = async () => {
    try {
      console.log("Starting logout process...");
      
      // First check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No active session found, cleaning up local state");
        // Clean up local state even if there's no session
        queryClient.clear();
        navigate("/");
        return;
      }
      
      // If we have a session, try to sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during logout:", error);
        // If we get a session_not_found error, we can still proceed with cleanup
        if (error.message.includes("session_not_found")) {
          console.log("Session not found, proceeding with cleanup");
        } else {
          toast.error("Logout failed");
          return;
        }
      }
      
      // Clear all cached data
      queryClient.clear();
      
      console.log("Logout successful");
      navigate("/");
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed");
    }
  };

  const redirectBasedOnUserType = (userType: UserType, userId: string) => {
    console.log("Redirecting based on user type:", userType);
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
        toast.error("Unknown user type");
    }
  };

  const handleAuthError = (error: any) => {
    console.error("Login error:", error);
    if (error.message.includes("Email not confirmed")) {
      toast.error("Please verify your email first. Check your inbox for the verification link.");
    } else if (error.message.includes("Invalid login credentials")) {
      toast.error("Incorrect email or password. Please try again or sign up for a new account.");
    } else {
      toast.error(error.message);
    }
  };

  return {
    login,
    logout,
  };
};

