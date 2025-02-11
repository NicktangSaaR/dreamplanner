
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, isValidUserType } from "./types";
import { useQueryClient } from "@tanstack/react-query";

export const useProfile = () => {
  const queryClient = useQueryClient();

  return useQuery({
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
          if (userError.message.includes("session_not_found")) {
            await supabase.auth.signOut();
            queryClient.setQueryData(["user-profile"], null);
          }
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
          user_type: userType,
          email: profileData.email
        };
      } catch (error) {
        console.error("Unexpected error in profile query:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: true,
  });
};

