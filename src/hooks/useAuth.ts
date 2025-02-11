
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";

export type UserType = "student" | "counselor" | "admin";

interface UserProfile {
  id: string;
  user_type: UserType;
  email?: string | null;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Initialize check session state
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session check error:", error);
        return;
      }
      if (session) {
        console.log("Initial session found");
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      }
    };
    checkSession();
  }, [queryClient]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<UserProfile | null> => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session error:", sessionError);
          return null;
        }

        if (!session) {
          console.log("No active session");
          return null;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Error getting user:", userError);
          return null;
        }
        if (!user) {
          console.log("No user found");
          return null;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, user_type, email")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return null;
        }

        if (!profileData) {
          console.log("No profile found for user");
          return null;
        }

        const userType = profileData.user_type as string;
        if (!isValidUserType(userType)) {
          console.error("Invalid user type:", userType);
          return null;
        }

        return {
          id: profileData.id,
          user_type: userType as UserType,
          email: profileData.email
        };
      } catch (error) {
        console.error("Unexpected error in profile query:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: true, // Always enable query
  });

  const isValidUserType = (type: string): type is UserType => {
    return ['student', 'counselor', 'admin'].includes(type);
  };

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

      if (!isValidUserType(profileData.user_type)) {
        console.error("Invalid user type:", profileData.user_type);
        toast.error("Invalid user type");
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
    profile,
    isLoading,
    login,
    logout,
    isAuthenticated: !!profile,
    userType: profile?.user_type,
  };
};
