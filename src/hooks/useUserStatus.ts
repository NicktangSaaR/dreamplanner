
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserStatus = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        if (user) {
          console.log("User ID found:", user.id);
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error("Error fetching user profile:", error);
            return;
          }
          
          const isAdminUser = profileData?.user_type === 'admin';
          console.log("User type:", profileData?.user_type, "Is admin:", isAdminUser);
          setIsAdmin(isAdminUser);
        } else {
          console.log("No user found");
        }
      } catch (error) {
        console.error("Error in useUserStatus:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getCurrentUser();
    
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      getCurrentUser();
    });
    
    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  return { currentUserId, isAdmin, isLoading };
};
