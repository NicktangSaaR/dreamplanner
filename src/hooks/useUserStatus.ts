
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserStatus = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profileData?.user_type === 'admin');
      }
    };
    getCurrentUser();
  }, []);

  return { currentUserId, isAdmin };
};
